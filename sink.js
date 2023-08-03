import amqp from "amqplib";

const port = process.env.PORT || 5018;

async function main() {
  const connection = await amqp.connect("amqp://localhost");
  const channel = await connection.createChannel();
  const { queue } = await channel.assertQueue("result_queue");

  channel.consume(queue, (msg) => {
    const message = msg.content.toString();
    console.log('Message: %s', message);
    channel.ack(msg);
  })

}

main().catch((err) => console.log(err));
