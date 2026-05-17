# ⚡ План интеграции для Backend-разработчика

Привет! Наш DevOps-инженер объединил бэкенд и фронтенд в единую экосистему Docker Compose, прокинул обратный прокси-сервер **Nginx** и полностью устранил проблемы с CORS.

Сейчас бэкенд успешно запускается, автоматически создает таблицы в базе данных PostgreSQL 15 и подключается к RabbitMQ в фоновом режиме. Твоя задача — реализовать полноценный REST API для управления задачами, связать его с отправкой WebSocket-событий и написать автоматический сид данных (seeding) при первом старте.

---

## 🔍 Текущий статус проекта (Глобальная архитектура)

Инфраструктура развернута в единой точке входа `http://localhost/` (обратный прокси Nginx на порту 80):
- **Точка входа API**: Доступна по адресу `http://localhost/api/` (внутри Docker проксируется на Uvicorn-сервер `http://api:8000/`).
- **Swagger Документация**: Автоматически доступна на [http://localhost/api/docs](http://localhost/api/docs).
- **Связь WebSockets**: Работает real-time точка доступа `/ws/tasks` (`ws://localhost/ws/tasks?project_id=global`).
- **База данных**: PostgreSQL 15. Персистентные таблицы создаются автоматически при старте FastAPI через SQLAlchemy.

### Что уже полностью готово на бэкенде:
1. **Фоновый консьюмер RabbitMQ** ([rabbitmq.py](file:///c:/Users/chebu/neta-tasks/victory-group-task-manager/backend/app/services/rabbitmq.py)):
   Автоматически слушает очередь `victory_queue` (exchange `victory_events`, routing key `vdl.events`). При поступлении событий аналитики (например, падение ROI) консьюмер сохраняет событие в таблицу `vdl_events` и транслирует его по WebSocket клиентам.
2. **WebSocket Connection Manager** ([websockets.py](file:///c:/Users/chebu/neta-tasks/victory-group-task-manager/backend/app/api/websockets.py)):
   Группирует активные WebSocket-сессии по `project_id` и предоставляет асинхронный метод `broadcast_to_project(project_id, event)` для мгновенной рассылки сообщений.
3. **Модели SQLAlchemy**:
   Полностью описаны модели: `User` (пользователи), `Project` (проекты), `Task` (задачи) и `VDLEvent` (события аналитики).
   - Енум статусов задачи `TaskStatus`: `TO_DO`, `READY`, `IN_PROGRESS`, `DONE`.
   - Енум приоритетов задачи `TaskPriority`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.

---

## 🛠️ Пошаговый план работы бэкендера

Твоя цель — предоставить фронтенду REST API интерфейс для работы с Kanban-доской.

### Шаг 1: Автоматический сид данных (Database Seeding) при старте
Чтобы при первом запуске контейнера доска не была пустой, напиши инициализационный скрипт, запускающийся на старте приложения (в `lifespan` в [main.py](file:///c:/Users/chebu/neta-tasks/victory-group-task-manager/backend/app/main.py)):
1. Проверь, пуста ли таблица `users`. Если пуста, создай тестовых пользователей (например, `Иван Иванов`, `Петр Петров`).
2. Проверь, пуста ли таблица `projects`. Если пуста, создай глобальный проект с `id = "global"` (или сгенерируй UUID и свяжи его).
3. Проверь, пуста ли таблица `tasks`. Если пуста, наполни её начальными задачами, соответствующими структуре из `frontend/src/mocks/tasks.json`, привязав их к статусам `TO_DO`, `READY`, `IN_PROGRESS`, `DONE`.

### Шаг 2: Реализация эндпоинтов управления задачами в [tasks.py](file:///c:/Users/chebu/neta-tasks/victory-group-task-manager/backend/app/api/routers/tasks.py)

Тебе необходимо реализовать 4 стандартных роута в роутере задач:

#### 1. Получение всех задач проекта: `GET /api/tasks`
- **Параметры**: `project_id: str = "global"`
- **Логика**: Вытаскивает все задачи из PostgreSQL, подгружая (`joinedload`) связанные объекты `assignee` и `vdl_event`.
- **Ответ**: Список задач в JSON-формате.

#### 2. Создание новой задачи: `POST /api/tasks`
- **Логика**: Принимает схему создания задачи, генерирует уникальный строковый ID (например, `VT-` + автоинкрементный счетчик или UUID), сохраняет её в базу данных.
- **WebSocket триггер**: После успешного коммита в БД отправляет широковещательное событие по сокету:
  ```python
  from app.api.websockets import manager
  
  await manager.broadcast_to_project(
      project_id=str(new_task.project_id),
      message={
          "event_type": "NEW_TASK",
          "payload": {
              "id": new_task.id,
              "title": new_task.title,
              "description": new_task.description,
              "status": new_task.status.value,
              "priority": new_task.priority.value,
              "createdAt": new_task.created_at.isoformat(),
              "deadline": new_task.deadline.isoformat() if new_task.deadline else None,
              "vdlEvent": None
          }
      }
  )
  ```

#### 3. Изменение задачи (Drag & Drop): `PATCH /api/tasks/{task_id}`
- **Логика**: Принимает поля для обновления (например, `status` при перетаскивании карточки). Обновляет запись в БД.
- **WebSocket триггер**: Рассылает событие изменения статуса всем клиентам:
  ```python
  await manager.broadcast_to_project(
      project_id=str(updated_task.project_id),
      message={
          "event_type": "TASK_UPDATED",
          "payload": {
              "id": updated_task.id,
              "status": updated_task.status.value,
              "message": f"Статус задачи {updated_task.id} изменен на {updated_task.status.value}"
          }
      }
  )
  ```

#### 4. Удаление задачи: `DELETE /api/tasks/{task_id}`
- **Логика**: Удаляет задачу из PostgreSQL.
- **WebSocket триггер**: Рассылает событие удаления:
  ```python
  await manager.broadcast_to_project(
      project_id=str(project_id),
      message={
          "event_type": "TASK_DELETED",
          "payload": {
              "id": task_id
          }
      }
  )
  ```

---

## 💡 Важный совет по разработке
Для тестирования RabbitMQ и WebSocket событий аналитики воспользуйся Swagger-документацией бэкенда (`http://localhost/api/docs`). Она уже содержит встроенные эндпоинты, которые позволят тебе отправлять имитационные RabbitMQ-сообщения в систему одной кнопкой, наблюдая за мгновенной реакцией доски на фронтенде!

За работу! С этой интеграцией проект получит мощное REST-хранилище и полноценный real-time цикл.
