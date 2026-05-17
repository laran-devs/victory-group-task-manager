import datetime
import uuid
from sqlalchemy import select, func
from app.core.database import AsyncSessionLocal
from app.models.user import User, UserRole
from app.models.project import Project
from app.models.task import Task, TaskStatus, TaskPriority
from app.models.vdl_event import VDLEvent, VDLEventType
from app.core.security import get_password_hash

async def seed_data():
    async with AsyncSessionLocal() as db:
        # 1. Seed Users
        # Check if users table is empty
        user_count_result = await db.execute(select(func.count(User.id)))
        user_count = user_count_result.scalar()
        
        user_ivan = None
        user_petr = None
        
        if user_count == 0:
            print("Seeding users...", flush=True)
            user_ivan = User(
                id=uuid.uuid4(),
                email="ivan@victory.ru",
                hashed_password=get_password_hash("victory123"),
                full_name="Иван Иванов",
                role=UserRole.ADMIN,
                position="Team Lead"
            )
            user_petr = User(
                id=uuid.uuid4(),
                email="petr@victory.ru",
                hashed_password=get_password_hash("victory123"),
                full_name="Петр Петров",
                role=UserRole.USER,
                position="Developer"
            )
            db.add_all([user_ivan, user_petr])
            await db.commit()
            await db.refresh(user_ivan)
            await db.refresh(user_petr)
            print("Users seeded successfully.", flush=True)
        else:
            # Get existing users to associate them later
            ivan_result = await db.execute(select(User).filter(User.email == "ivan@victory.ru"))
            user_ivan = ivan_result.scalars().first()
            petr_result = await db.execute(select(User).filter(User.email == "petr@victory.ru"))
            user_petr = petr_result.scalars().first()
            if not user_ivan or not user_petr:
                # Fallback to any two users if the specific test ones are not present
                all_users_result = await db.execute(select(User).limit(2))
                all_users = all_users_result.scalars().all()
                if len(all_users) >= 2:
                    user_ivan, user_petr = all_users[0], all_users[1]
                elif len(all_users) == 1:
                    user_ivan = all_users[0]
                    user_petr = all_users[0]
        
        # 2. Seed Projects
        # Check if projects table is empty
        project_count_result = await db.execute(select(func.count(Project.id)))
        project_count = project_count_result.scalar()
        
        if project_count == 0:
            print("Seeding global project...", flush=True)
            owner_id = user_ivan.id if user_ivan else uuid.uuid4()
            global_project = Project(
                id="global",
                name="Global Project",
                description="Global Victory Group project for all tasks",
                owner_id=owner_id
            )
            db.add(global_project)
            await db.commit()
            print("Global project seeded successfully.", flush=True)

        # 3. Seed Tasks
        task_count_result = await db.execute(select(func.count(Task.id)))
        task_count = task_count_result.scalar()
        
        if task_count == 0:
            print("Seeding tasks from mock data...", flush=True)
            mock_tasks = [
                {
                    "id": "VT-101",
                    "title": "Разработка модуля аутентификации",
                    "description": "Реализовать вход через JWT и интеграцию с Victory ID.",
                    "status": "TO_DO",
                    "priority": "Высокий",
                    "createdAt": "2026-05-10T10:00:00Z",
                    "deadline": "2026-05-20T18:00:00Z",
                    "vdlEvent": None,
                    "assignee": "ivan"
                },
                {
                    "id": "VT-102",
                    "title": "Оптимизация SEO для медицинского хаба",
                    "description": "Проверить мета-теги и структуру заголовков на основных лендингах.",
                    "status": "IN_PROGRESS",
                    "priority": "Средний",
                    "createdAt": "2026-05-12T09:30:00Z",
                    "deadline": "2026-05-25T18:00:00Z",
                    "vdlEvent": {
                        "type": "CPL",
                        "message": "CPL Рост +20%",
                        "severity": "critical"
                    },
                    "assignee": "petr"
                },
                {
                    "id": "VT-103",
                    "title": "Настройка аналитики Auto-портала",
                    "description": "Подключить VDL Event tracking для воронки продаж.",
                    "status": "TO_DO",
                    "priority": "Критический",
                    "createdAt": "2026-05-14T11:00:00Z",
                    "deadline": "2026-05-18T18:00:00Z",
                    "vdlEvent": None,
                    "assignee": None
                },
                {
                    "id": "VT-104",
                    "title": "Дизайн UI-кита для Victory Group",
                    "description": "Обновить компоненты кнопок и инпутов согласно новому гайдлайну.",
                    "status": "DONE",
                    "priority": "Низкий",
                    "createdAt": "2026-05-05T08:00:00Z",
                    "deadline": "2026-05-15T18:00:00Z",
                    "vdlEvent": None,
                    "assignee": None
                },
                {
                    "id": "VT-105",
                    "title": "Аудит ROI по Performance-кампаниям",
                    "description": "Проанализировать снижение эффективности в сегменте B2B.",
                    "status": "IN_PROGRESS",
                    "priority": "Критический",
                    "createdAt": "2026-05-15T14:00:00Z",
                    "deadline": "2026-05-22T18:00:00Z",
                    "vdlEvent": {
                        "type": "ROI",
                        "message": "ROI Снижение",
                        "severity": "critical"
                    },
                    "assignee": "petr"
                }
            ]
            
            # Map priorities
            priority_map = {
                "Низкий": TaskPriority.LOW,
                "Средний": TaskPriority.MEDIUM,
                "Высокий": TaskPriority.HIGH,
                "Критический": TaskPriority.CRITICAL
            }
            
            for task_data in mock_tasks:
                # Determine Assignee
                assignee_id = None
                if task_data["assignee"] == "ivan" and user_ivan:
                    assignee_id = user_ivan.id
                elif task_data["assignee"] == "petr" and user_petr:
                    assignee_id = user_petr.id
                
                # Check VDL Event
                vdl_event_id = None
                if task_data["vdlEvent"]:
                    event_info = task_data["vdlEvent"]
                    db_event = VDLEvent(
                        id=uuid.uuid4(),
                        type=VDLEventType(event_info["type"]),
                        message=event_info["message"],
                        severity=event_info["severity"],
                        timestamp=datetime.datetime.utcnow()
                    )
                    db.add(db_event)
                    await db.flush() # Flush to assign database ID to db_event
                    vdl_event_id = db_event.id
                
                # Convert ISO string dates to datetime objects
                created_at = datetime.datetime.fromisoformat(task_data["createdAt"].replace("Z", "+00:00"))
                deadline = datetime.datetime.fromisoformat(task_data["deadline"].replace("Z", "+00:00")) if task_data["deadline"] else None
                
                # Create Task
                db_task = Task(
                    id=task_data["id"],
                    title=task_data["title"],
                    description=task_data["description"],
                    status=TaskStatus(task_data["status"]),
                    priority=priority_map.get(task_data["priority"], TaskPriority.MEDIUM),
                    project_id="global",
                    assignee_id=assignee_id,
                    vdl_event_id=vdl_event_id,
                    created_at=created_at.replace(tzinfo=None),
                    deadline=deadline.replace(tzinfo=None) if deadline else None
                )
                db.add(db_task)
            
            await db.commit()
            print("Tasks seeded successfully.", flush=True)
