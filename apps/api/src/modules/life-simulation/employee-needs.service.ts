import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmployeeNeedsData } from '@vac/shared';

interface PersonalityModifier {
  thirstDecayMod: number;
  hungerDecayMod: number;
  energyDecayMod: number;
  focusDecayMod: number;
  socialDecayMod: number;
}

@Injectable()
export class EmployeeNeedsService {
  private readonly logger = new Logger(EmployeeNeedsService.name);

  // In-memory cache for fast simulation ticks (0-100 scale: HIGHER = HEALTHIER / BETTER)
  private readonly needsCache: Map<string, EmployeeNeedsData> = new Map();

  // Dirty flag set to track which records need database persistence
  private readonly dirtyEmployees: Set<string> = new Set();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Initializes needs for all active employees from PostgreSQL
   * If an employee doesn't have a needs record yet, create one with default 100.0 (optimal health).
   */
  async initialize(): Promise<void> {
    try {
      const employees = await this.prisma.employee.findMany({
        where: { status: 'ACTIVE' },
        include: { needs: true },
      });

      const now = new Date();

      for (const emp of employees) {
        if (emp.needs) {
          this.needsCache.set(emp.id, {
            id: emp.needs.id,
            employeeId: emp.id,
            energy: emp.needs.energy,
            hunger: emp.needs.hunger,
            thirst: emp.needs.thirst,
            focus: emp.needs.focus,
            social: emp.needs.social,
            mood: emp.needs.mood,
            lastUpdated: emp.needs.lastUpdated.toISOString(),
          });
        } else {
          // Create initial optimal needs in database
          const created = await this.prisma.employeeNeeds.create({
            data: {
              employeeId: emp.id,
              energy: 100.0,
              hunger: 100.0,
              thirst: 100.0,
              focus: 100.0,
              social: 100.0,
              mood: 100.0,
              lastUpdated: now,
            },
          });

          this.needsCache.set(emp.id, {
            id: created.id,
            employeeId: emp.id,
            energy: created.energy,
            hunger: created.hunger,
            thirst: created.thirst,
            focus: created.focus,
            social: created.social,
            mood: created.mood,
            lastUpdated: created.lastUpdated.toISOString(),
          });
        }
      }

      this.logger.log(`Initialized EmployeeNeedsService for ${this.needsCache.size} employees`);
    } catch (err: any) {
      this.logger.error(`Failed to initialize employee needs: ${err.message}`);
    }
  }

  /**
   * Returns personality-based rate modifier for an employee
   */
  private getPersonalityModifier(employeeId: string): PersonalityModifier {
    // Standard baseline
    const baseline: PersonalityModifier = {
      thirstDecayMod: 1.0,
      hungerDecayMod: 1.0,
      energyDecayMod: 1.0,
      focusDecayMod: 1.0,
      socialDecayMod: 1.0,
    };

    return baseline;
  }

  getNeeds(employeeId: string): EmployeeNeedsData | null {
    return this.needsCache.get(employeeId) || null;
  }

  getAllNeeds(): Record<string, EmployeeNeedsData> {
    const res: Record<string, EmployeeNeedsData> = {};
    for (const [id, val] of this.needsCache.entries()) {
      res[id] = { ...val };
    }
    return res;
  }

  /**
   * Deterministically decays needs over simulated elapsed time (in minutes)
   * Semantic Rule: HIGHER = HEALTHIER. Decay means value DECREASES towards 0.
   */
  decayNeeds(
    employeeId: string,
    elapsedMinutes: number,
    activity: string,
  ): EmployeeNeedsData | null {
    const current = this.needsCache.get(employeeId);
    if (!current) return null;

    if (elapsedMinutes <= 0) return current;

    const mod = this.getPersonalityModifier(employeeId);
    const isWorking = activity === 'WORKING' || activity === 'THINKING';

    // Base decay rates per minute (higher activity = faster fatigue/thirst)
    const thirstDecayRate = (isWorking ? 1.0 : 0.6) * mod.thirstDecayMod;
    const hungerDecayRate = (isWorking ? 0.7 : 0.4) * mod.hungerDecayMod;
    const energyDecayRate = (isWorking ? 0.5 : 0.2) * mod.energyDecayMod;
    const focusDecayRate = (isWorking ? 0.8 : 0.3) * mod.focusDecayMod;
    const socialDecayRate = 0.4 * mod.socialDecayMod;

    // Calculate new values clamped between 0.0 and 100.0
    const newThirst = Math.max(0, current.thirst - thirstDecayRate * elapsedMinutes);
    const newHunger = Math.max(0, current.hunger - hungerDecayRate * elapsedMinutes);
    const newEnergy = Math.max(0, current.energy - energyDecayRate * elapsedMinutes);
    const newFocus = Math.max(0, current.focus - focusDecayRate * elapsedMinutes);
    const newSocial = Math.max(0, current.social - socialDecayRate * elapsedMinutes);

    // Dynamic Mood is a weighted reflection of overall physical and mental state
    const newMood = Math.max(
      0,
      Math.min(
        100,
        newEnergy * 0.25 +
          newHunger * 0.2 +
          newThirst * 0.2 +
          newFocus * 0.2 +
          newSocial * 0.15,
      ),
    );

    const updated: EmployeeNeedsData = {
      ...current,
      thirst: Number(newThirst.toFixed(1)),
      hunger: Number(newHunger.toFixed(1)),
      energy: Number(newEnergy.toFixed(1)),
      focus: Number(newFocus.toFixed(1)),
      social: Number(newSocial.toFixed(1)),
      mood: Number(newMood.toFixed(1)),
      lastUpdated: new Date().toISOString(),
    };

    this.needsCache.set(employeeId, updated);
    this.dirtyEmployees.add(employeeId);

    return updated;
  }

  /**
   * Replenishes a specific need (e.g. drinking, eating, resting, socializing)
   */
  replenishNeed(
    employeeId: string,
    needType: 'thirst' | 'hunger' | 'energy' | 'focus' | 'social',
    amount: number,
  ): EmployeeNeedsData | null {
    const current = this.needsCache.get(employeeId);
    if (!current) return null;

    const updatedValue = Math.min(100.0, current[needType] + amount);
    current[needType] = Number(updatedValue.toFixed(1));

    // Recompute mood
    current.mood = Number(
      Math.max(
        0,
        Math.min(
          100,
          current.energy * 0.25 +
            current.hunger * 0.2 +
            current.thirst * 0.2 +
            current.focus * 0.2 +
            current.social * 0.15,
        ),
      ).toFixed(1),
    );
    current.lastUpdated = new Date().toISOString();

    this.needsCache.set(employeeId, current);
    this.dirtyEmployees.add(employeeId);

    return current;
  }

  /**
   * Directly sets needs for deterministic testing or manual intervention
   */
  setNeeds(employeeId: string, overrides: Partial<Omit<EmployeeNeedsData, 'id' | 'employeeId'>>): EmployeeNeedsData | null {
    const current = this.needsCache.get(employeeId);
    if (!current) return null;

    const updated: EmployeeNeedsData = {
      ...current,
      ...overrides,
      lastUpdated: new Date().toISOString(),
    };

    // Recompute mood if not explicitly overridden
    if (overrides.mood === undefined) {
      updated.mood = Number(
        Math.max(
          0,
          Math.min(
            100,
            updated.energy * 0.25 +
              updated.hunger * 0.2 +
              updated.thirst * 0.2 +
              updated.focus * 0.2 +
              updated.social * 0.15,
          ),
        ).toFixed(1),
      );
    }

    this.needsCache.set(employeeId, updated);
    this.dirtyEmployees.add(employeeId);

    return updated;
  }

  /**
   * Flushes dirty needs in-memory state to PostgreSQL (batch write)
   */
  async flushDirtyNeeds(): Promise<number> {
    if (this.dirtyEmployees.size === 0) return 0;

    const ids = Array.from(this.dirtyEmployees);
    this.dirtyEmployees.clear();

    let flushedCount = 0;
    for (const empId of ids) {
      const state = this.needsCache.get(empId);
      if (!state) continue;

      try {
        await this.prisma.employeeNeeds.upsert({
          where: { employeeId: empId },
          update: {
            energy: state.energy,
            hunger: state.hunger,
            thirst: state.thirst,
            focus: state.focus,
            social: state.social,
            mood: state.mood,
            lastUpdated: new Date(state.lastUpdated),
          },
          create: {
            employeeId: empId,
            energy: state.energy,
            hunger: state.hunger,
            thirst: state.thirst,
            focus: state.focus,
            social: state.social,
            mood: state.mood,
            lastUpdated: new Date(state.lastUpdated),
          },
        });
        flushedCount++;
      } catch (err: any) {
        this.logger.error(`Error saving employee needs for [${empId}]: ${err.message}`);
        this.dirtyEmployees.add(empId); // Re-queue for next flush
      }
    }

    return flushedCount;
  }
}

