import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { LifeSimulationService } from './life-simulation.service';
import { EmployeeNeedsService } from './employee-needs.service';
import { OfficeFacilitiesService } from './office-facilities.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('life-simulation')
export class LifeSimulationController {
  constructor(
    private readonly simulationService: LifeSimulationService,
    private readonly needsService: EmployeeNeedsService,
    private readonly facilitiesService: OfficeFacilitiesService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('status')
  async getStatus() {
    const allNeeds = this.needsService.getAllNeeds();
    const allStates = this.simulationService.getAllLifeStates();
    const allFacilities = this.facilitiesService.getAllFacilities();

    return {
      simulationEngine: 'active',
      timestamp: new Date().toISOString(),
      employeesCount: Object.keys(allStates).length,
      facilitiesCount: allFacilities.length,
      needs: allNeeds,
      lifeStates: allStates,
      facilities: allFacilities,
    };
  }

  @Get('employees/:id')
  async getEmployeeLifeDetail(@Param('id') employeeId: string) {
    const needs = this.needsService.getNeeds(employeeId);
    const lifeState = this.simulationService.getLifeState(employeeId);
    const recentEvents = await this.prisma.employeeLifeEvent.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      employeeId,
      needs,
      lifeState,
      recentEvents,
    };
  }

  @Post('tick')
  async triggerSimulationTick(@Body() body: { simulatedElapsedSeconds?: number }) {
    const elapsed = body.simulatedElapsedSeconds || 10;
    const transitionsCount = await this.simulationService.runSimulationTick(elapsed);

    return {
      success: true,
      simulatedElapsedSeconds: elapsed,
      transitionsCount,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('employees/:id/intervene')
  async interveneEmployee(
    @Param('id') employeeId: string,
    @Body() body: { action: 'drink' | 'eat' | 'rest' | 'work' | 'reset' },
  ) {
    const updated = await this.simulationService.interveneEmployee(
      employeeId,
      body.action || 'reset',
    );

    return {
      success: true,
      employeeId,
      action: body.action,
      updatedState: updated,
    };
  }

  @Post('reset-needs')
  async resetAllNeeds() {
    const employees = await this.prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });

    for (const emp of employees) {
      this.needsService.setNeeds(emp.id, {
        energy: 100.0,
        hunger: 100.0,
        thirst: 100.0,
        focus: 100.0,
        social: 100.0,
        mood: 100.0,
      });
    }

    await this.needsService.flushDirtyNeeds();

    return {
      success: true,
      message: 'All employee needs reset to 100.0 (optimal condition)',
      count: employees.length,
    };
  }
}

