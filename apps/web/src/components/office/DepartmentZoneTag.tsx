import React from 'react';
import { Html } from '@react-three/drei';
import { INITIAL_DEPARTMENTS, InitialDepartmentDefinition } from '@vac/shared';
import { useOfficeStore } from '../../store/useOfficeStore';
import { useCompanyStore } from '../../store/useCompanyStore';

export const DepartmentZoneTags: React.FC = () => {
  const { showLabels, selectZone, setHoveredZone, selectedZone } = useOfficeStore();
  const { departments, employees } = useCompanyStore();

  if (!showLabels) return null;

  return (
    <group position={[0, 0, 0]}>
      {INITIAL_DEPARTMENTS.map((dept: InitialDepartmentDefinition) => {
        const backendDept = departments.find(
          (d) => d.slug === dept.slug || d.name.toLowerCase() === dept.name.toLowerCase(),
        );
        const employeeCount =
          backendDept?._count?.employees !== undefined
            ? backendDept._count.employees
            : employees.filter((e) => e.department?.slug === dept.slug).length;
        const isSelected = selectedZone?.slug === dept.slug;

        return (
          <group
            key={`tag-${dept.slug}`}
            position={[dept.zoneBounds.x, 3.4, dept.zoneBounds.z]}
          >
            <Html center distanceFactor={24} zIndexRange={[50, 0]}>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  selectZone({
                    id: backendDept?.id || dept.slug,
                    name: dept.name,
                    slug: dept.slug,
                    floorZone: dept.floorZone,
                    color: dept.color,
                    description: dept.description,
                    employeeCount,
                  });
                }}
                onMouseEnter={() => setHoveredZone(dept.slug)}
                onMouseLeave={() => setHoveredZone(null)}
                className={`cursor-pointer select-none transition-all duration-200 transform hover:scale-105 px-2.5 py-1 rounded-full backdrop-blur-md border shadow-sm flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-white border-amber-400 ring-2 ring-amber-300/40 text-slate-900 font-bold'
                    : 'bg-white/90 border-amber-200/70 hover:border-amber-300 text-slate-700'
                }`}
              >
                {/* Department Accent Dot */}
                <span
                  className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: dept.color }}
                />

                {/* Department Title */}
                <span className="text-[11px] font-semibold whitespace-nowrap tracking-tight">
                  {dept.name}
                </span>

                {/* Employee Count Badge */}
                <span className="text-[9px] font-medium px-1.5 py-0.2 rounded-full bg-amber-50 text-amber-900 border border-amber-200/60">
                  {employeeCount} AI
                </span>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
};
