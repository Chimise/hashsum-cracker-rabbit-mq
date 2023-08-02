import amqp from "amqplib";
import { processTask } from "./process-task.js";

async function main() {
  const connection = await amqp.connect("amqp://localhost");
  const channel = await connection.createChannel();
  const { queue } = await channel.assertQueue("task_queue");
  const { queue: collector } = await channel.assertQueue("result_queue");

  channel.consume(queue, (msg) => {
    const message = msg.content.toString();
    const found = processTask(JSON.parse(message));
    if(found) {
      console.log('Found: %s', found);
      channel.sendToQueue(collector, Buffer.from(`Found: ${found}`));
    }

    channel.ack(msg);
  })
}

main().catch((err) => console.log(err));
