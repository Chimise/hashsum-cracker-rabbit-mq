import amqp from "amqplib";
import { processTask } from "./process-task.js";

const { pid } = process;

async function main() {
  const connection = await amqp.connect("amqp://localhost");
  const channel = await connection.createChannel();
  const { exchange } = await channel.assertExchange("worker-queue", "fanout");
  const { queue: workerQueue } = await channel.assertQueue(`worker-${pid}`, {
    exclusive: true,
  });

  const { queue } = await channel.assertQueue("task_queue");
  const { queue: collector } = await channel.assertQueue("result_queue");

  await channel.bindQueue(workerQueue, exchange);

  channel.consume(
    workerQueue,
    (msg) => {
      const message = JSON.parse(msg.content.toString());
      // Close all active worker instances
      if (message.event === "matched") {
        channel.close().then(() => {
          console.log("Channel closed successfully");
          return connection.close();
        });
      }
    },
    { noAck: true }
  );

  channel.consume(queue, (msg) => {
    const message = msg.content.toString();
    const found = processTask(JSON.parse(message));
    if (found) {
      console.log("Found: %s", found);
      channel.sendToQueue(collector, Buffer.from(`Found: ${found}`));
      // Send message to close all active remote workers
      channel.publish(
        exchange,
        "",
        Buffer.from(JSON.stringify({ event: "matched" }))
      );
    }

    channel.ack(msg);
  });
}

main().catch((err) => console.log(err));
