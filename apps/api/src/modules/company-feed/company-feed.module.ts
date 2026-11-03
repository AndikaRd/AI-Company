import { Module, forwardRef } from '@nestjs/common';
import { CompanyFeedService } from './company-feed.service';
import { CompanyFeedController } from './company-feed.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { EmployeesModule } from '../employees/employees.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => EventsModule),
    forwardRef(() => EmployeesModule),
    forwardRef(() => TasksModule),
  ],
  controllers: [CompanyFeedController],
  providers: [CompanyFeedService],
  exports: [CompanyFeedService],
})
export class CompanyFeedModule {}

