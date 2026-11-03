import React from 'react';
import { useCompanyStore } from '../../store/useCompanyStore';
import { useOfficeStore } from '../../store/useOfficeStore';
import { LowPolyCharacter } from './LowPolyCharacter';
import {
  OFFICE_FACILITY_COORDINATES,
  getFacilityPosition,
} from './officeSpatialCoordinates';
import { Employee, LifeBehaviorState } from '@vac/shared';

interface OfficeCharactersLayerProps {
  onSelectAgent?: (employeeId: string) => void;
}

export const OfficeCharactersLayer: React.FC<OfficeCharactersLayerProps> = ({
  onSelectAgent,
}) => {
  const { employees } = useCompanyStore();
  const { employeeLifeStates, employeeActivities } = useOfficeStore();

  const getTargetPositionAndRotation = (
    employee: Employee,
  ): { position: [number, number, number]; rotationY: number; behavior: LifeBehaviorState | 'IDLE'; thought: string | null } => {
    const lifeState = employeeLifeStates[employee.id];
    const activityInfo = employeeActivities[employee.id];

    // Default home workstation
    let defaultLoc = 'workstation_alex';
    let defaultRot = Math.PI;

    if (employee.employeeCode === 'VAC-TECH-001' || employee.firstName.toLowerCase().includes('marcus')) {
      defaultLoc = 'workstation_marcus';
      defaultRot = Math.PI;
    } else if (employee.employeeCode === 'VAC-RES-001' || employee.firstName.toLowerCase().includes('maya')) {
      defaultLoc = 'workstation_maya';
      defaultRot = Math.PI;
    } else if (employee.employeeCode === 'VAC-OPS-001' || employee.firstName.toLowerCase().includes('elena')) {
      defaultLoc = 'workstation_elena';
      defaultRot = 0;
    } else if (employee.employeeCode === 'VAC-QA-001' || employee.firstName.toLowerCase().includes('sophia')) {
      defaultLoc = 'workstation_sophia';
      defaultRot = 0;
    }

    if (!lifeState) {
      const coord = OFFICE_FACILITY_COORDINATES[defaultLoc];
      return {
        position: coord ? coord.position : [0, 0, 0],
        rotationY: coord?.seatRotationY ?? defaultRot,
        behavior: (activityInfo?.activity as any) || 'IDLE',
        thought: null,
      };
    }

    const behavior = lifeState.behavior || 'IDLE';
    const locId =
      behavior === 'WALKING' && lifeState.destinationLocationId
        ? lifeState.destinationLocationId
        : lifeState.currentLocationId || defaultLoc;

    const coord = OFFICE_FACILITY_COORDINATES[locId];
    const pos = coord ? coord.position : getFacilityPosition(locId);
    const rot = coord?.seatRotationY ?? defaultRot;

    return {
      position: pos,
      rotationY: rot,
      behavior,
      thought: lifeState.currentThought || null,
    };
  };

  return (
    <group name="OfficeCharactersLayer">
      {employees.map((emp) => {
        const { position, rotationY, behavior, thought } = getTargetPositionAndRotation(emp);
        const activityState = employeeActivities[emp.id]?.activity || 'IDLE';

        return (
          <LowPolyCharacter
            key={emp.id}
            employee={emp}
            targetPosition={position}
            targetRotationY={rotationY}
            behaviorState={behavior}
            activityState={activityState}
            thought={thought}
            onSelect={onSelectAgent}
          />
        );
      })}
    </group>
  );
};

