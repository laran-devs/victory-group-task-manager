import uuid
import datetime
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, UserRole
from app.models.project import Project
from app.models.task import Task, TaskStatus, TaskPriority
from app.models.vdl_event import VDLEvent, VDLEventType
from app.core.security import get_password_hash

GLOBAL_PROJECT_UUID = uuid.UUID("00000000-0000-0000-0000-000000000000")
USER_1_UUID = uuid.UUID("11111111-1111-1111-1111-111111111111")
USER_2_UUID = uuid.UUID("22222222-2222-2222-2222-222222222222")
USER_3_UUID = uuid.UUID("33333333-3333-3333-3333-333333333333")

async def seed_database(db: AsyncSession):
    # 1. Seed Users
    result = await db.execute(select(func.count(User.id)))
    users_count = result.scalar() or 0
    if users_count == 0:
        print("🌱 Seeding users...", flush=True)
        hashed_password = get_password_hash("password123")
        
        user_1 = User(
            id=USER_1_UUID,
            email="ivan@victory.group",
            hashed_password=hashed_password,
            full_name="Иван Иванов",
            role=UserRole.ADMIN,
            position="Lead Project Manager"
        )
        user_2 = User(
            id=USER_2_UUID,
            email="petr@victory.group",
            hashed_password=hashed_password,
            full_name="Петр Петров",
            role=UserRole.USER,
            position="Senior Frontend Developer"
        )
        user_3 = User(
            id=USER_3_UUID,
            email="alex@victory.group",
            hashed_password=hashed_password,
            full_name="Алексей Смирнов",
            role=UserRole.USER,
            position="Performance Analyst"
        )
        
        db.add_all([user_1, user_2, user_3])
        await db.flush()
        print("✓ Users seeded successfully", flush=True)
    else:
        print("✓ Users already seeded", flush=True)

    # 2. Seed Projects
    result = await db.execute(select(func.count(Project.id)))
    projects_count = result.scalar() or 0
    if projects_count == 0:
        print("🌱 Seeding global project...", flush=True)
        global_project = Project(
            id=GLOBAL_PROJECT_UUID,
            name="Global Victory Project",
            description="Глобальная Kanban-доска для управления всеми задачами холдинга",
            owner_id=USER_1_UUID
        )
        db.add(global_project)
        await db.flush()
        print("✓ Global project seeded successfully", flush=True)
    else:
        print("✓ Global project already seeded", flush=True)

    # 3. Seed Tasks
    result = await db.execute(select(func.count(Task.id)))
    tasks_count = result.scalar() or 0
    if tasks_count == 0:
        print("🌱 Seeding tasks from mock template...", flush=True)
        
        # We need some VDL Events first
        vdl_event_1 = VDLEvent(
            type=VDLEventType.CPL,
            message="CPL Рост +20%",
            severity="critical"
        )
        vdl_event_2 = VDLEvent(
            type=VDLEventType.ROI,
            message="ROI Снижение",
            severity="critical"
        )
        db.add_all([vdl_event_1, vdl_event_2])
        await db.flush()

        task_1 = Task(
            id="VT-101",
            title="Разработка модуля аутентификации",
            description="Реализовать вход через JWT и интеграцию с Victory ID.",
            status=TaskStatus.TO_DO,
            priority=TaskPriority.HIGH,
            tags=["#Development", "#Security"],
            deadline=datetime.datetime(2026, 5, 20, 18, 0, 0),
            project_id=GLOBAL_PROJECT_UUID,
            assignee_id=USER_2_UUID,
            vdl_event_id=None
        )
        task_2 = Task(
            id="VT-102",
            title="Оптимизация SEO для медицинского хаба",
            description="Проверить мета-теги и структуру заголовков на основных лендингах.",
            status=TaskStatus.IN_PROGRESS,
            priority=TaskPriority.MEDIUM,
            tags=["#SEO", "#Medical"],
            deadline=datetime.datetime(2026, 5, 25, 18, 0, 0),
            project_id=GLOBAL_PROJECT_UUID,
            assignee_id=USER_1_UUID,
            vdl_event_id=vdl_event_1.id
        )
        task_3 = Task(
            id="VT-103",
            title="Настройка аналитики Auto-портала",
            description="Подключить VDL Event tracking для воронки продаж.",
            status=TaskStatus.TO_DO,
            priority=TaskPriority.CRITICAL,
            tags=["#Auto", "#Performance"],
            deadline=datetime.datetime(2026, 5, 18, 18, 0, 0),
            project_id=GLOBAL_PROJECT_UUID,
            assignee_id=USER_3_UUID,
            vdl_event_id=None
        )
        task_4 = Task(
            id="VT-104",
            title="Дизайн UI-кита для Victory Tasks",
            description="Обновить компоненты кнопок и инпутов согласно новому гайдлайну.",
            status=TaskStatus.DONE,
            priority=TaskPriority.LOW,
            tags=["#Design"],
            deadline=datetime.datetime(2026, 5, 15, 18, 0, 0),
            project_id=GLOBAL_PROJECT_UUID,
            assignee_id=USER_2_UUID,
            vdl_event_id=None
        )
        task_5 = Task(
            id="VT-105",
            title="Аудит ROI по Performance-кампаниям",
            description="Проанализировать снижение эффективности в сегменте B2B.",
            status=TaskStatus.IN_PROGRESS,
            priority=TaskPriority.CRITICAL,
            tags=["#Performance"],
            deadline=datetime.datetime(2026, 5, 22, 18, 0, 0),
            project_id=GLOBAL_PROJECT_UUID,
            assignee_id=USER_3_UUID,
            vdl_event_id=vdl_event_2.id
        )

        db.add_all([task_1, task_2, task_3, task_4, task_5])
        await db.flush()
        print("✓ Tasks seeded successfully", flush=True)
    else:
        print("✓ Tasks already seeded", flush=True)

    await db.commit()
    print("✨ Database fully ready and seeded! ✨", flush=True)
