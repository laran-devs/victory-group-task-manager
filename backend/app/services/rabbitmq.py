import json
import asyncio
import aio_pika
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.vdl_event import VDLEvent, VDLEventType
from app.schemas.vdl_event import VDLEvent as VDLEventSchema
from app.api.websockets import manager

async def process_message(message: aio_pika.IncomingMessage):
    async with message.process():
        try:
            body = json.loads(message.body.decode())
            print(f"Received RabbitMQ VDL Event: {body}", flush=True)
            
            event_type = body.get("type", "ROI")
            event_message = body.get("message", "")
            severity = body.get("severity", "info")
            project_id = body.get("project_id")
            
            # Save to Database
            async with AsyncSessionLocal() as db:
                db_event = VDLEvent(
                    type=VDLEventType(event_type),
                    message=event_message,
                    severity=severity
                )
                db.add(db_event)
                await db.commit()
                await db.refresh(db_event)
                
                # Transform into Pydantic schema
                event_data = VDLEventSchema.model_validate(db_event).model_dump(mode="json")
            
            # Broadcast to WebSockets
            ws_payload = {
                "event_type": "VDL_ALERT",
                "payload": event_data
            }
            if project_id:
                await manager.broadcast_to_project(str(project_id), ws_payload)
            else:
                await manager.broadcast_global(ws_payload)
                
        except Exception as e:
            print(f"Error processing RabbitMQ message: {e}", flush=True)

async def consume_events():
    loop = asyncio.get_running_loop()
    connection = None
    # Add retry logic as RabbitMQ might take time to boot up in Docker
    for i in range(15):
        try:
            connection = await aio_pika.connect_robust(
                settings.RABBITMQ_URL,
                loop=loop
            )
            print("Successfully connected to RabbitMQ", flush=True)
            break
        except Exception as e:
            print(f"RabbitMQ connection failed (attempt {i+1}/15): {e}", flush=True)
            await asyncio.sleep(5)
            
    if not connection:
        print("Could not connect to RabbitMQ after 15 attempts. Background consumer disabled.", flush=True)
        return

    try:
        async with connection:
            channel = await connection.channel()
            
            # Declare exchange
            exchange = await channel.declare_exchange(
                "victory_events",
                type=aio_pika.ExchangeType.TOPIC
            )
            
            # Declare queue
            queue = await channel.declare_queue("victory_queue", durable=True)
            
            # Bind queue to exchange (routing key: vdl.events or # for all)
            await queue.bind(exchange, routing_key="vdl.events")
            
            print("Starting RabbitMQ consumption on queue 'victory_queue'...", flush=True)
            async with queue.iterator() as queue_iter:
                async for message in queue_iter:
                    await process_message(message)
    except asyncio.CancelledError:
        print("RabbitMQ consumer task cancelled", flush=True)
    except Exception as e:
        print(f"RabbitMQ connection error: {e}", flush=True)
