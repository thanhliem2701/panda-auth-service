import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const configService = appContext.get(ConfigService);
  const amqp_url = configService.get<string>('AMQP_URL');
  const amqp_queue = configService.get<string>('AMQP_QUEUE');
  if (!amqp_url) {
    throw new Error('AMQP_URL is not defined in the configuration');
  }
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule,{
    transport: Transport.RMQ,
    options:{
      urls:[amqp_url],
      queue: amqp_queue,
      queueOptions:{
        durable:true,
      }
    }
  });
  await app.listen();
}
bootstrap();
