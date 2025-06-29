import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const configService = appContext.get(ConfigService);
  const rabbitUrl = configService.get<string>('AMQP_URL');
  const queueName = configService.get<string>('AMQP_QUEUE');
  if (!rabbitUrl) {
    throw new Error('RABBITMQ_URL is not defined in the configuration');
  }
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule,{
    transport: Transport.RMQ,
    options:{
      urls:[rabbitUrl],
      queue: queueName,
      queueOptions:{
        durable:true,
      }
    }
  });
  await app.listen();
}
bootstrap();
