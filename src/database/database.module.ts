import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const db = config.get('database');
        if (!db) {
          throw new Error('Database config is required');
        }
        return {
          dialect: 'mysql',
          host: db.host,
          port: db.port,
          username: db.username,
          password: db.password,
          database: db.database,
          autoLoadModels: true,
          synchronize: false,
          logging:
            config.get('app.nodeEnv') === 'development' ? console.log : false,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
