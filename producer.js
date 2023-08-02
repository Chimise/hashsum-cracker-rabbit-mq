import amqp from 'amqplib';
import { generateTasks } from './generate-task.js';

const ALPHABETS = 'abcdefghijklmnopqrstuvwxyz';
const BATCH_SIZE = 10000;
const PORT = process.env.PORT || 5016;

const [,, maxLength, searchHash] = process.argv;

async function main() {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createConfirmChannel();
    const {queue} = await channel.assertQueue('task_queue');


    const generatorObj = generateTasks(searchHash, ALPHABETS, maxLength, BATCH_SIZE);

    for (const task of generatorObj) {
        channel.sendToQueue(queue, Buffer.from(JSON.stringify(task)));
    }

    await channel.waitForConfirms();
    channel.close();
    connection.close();
}

main().catch(err => console.log(err));