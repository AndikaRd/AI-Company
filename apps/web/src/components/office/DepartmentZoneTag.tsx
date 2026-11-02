import React from 'react';
import { Html } from '@react-three/drei';
import { INITIAL_DEPARTMENTS, InitialDepartmentDefinition } from '@vac/shared';
import { useOfficeStore } from '../../store/useOfficeStore';
import { useCompanyStore } from '../../store/useCompanyStore';

export const DepartmentZoneTags: React.FC = () => {
  const { showLabels, selectZone, setHoveredZone, selectedZone } = useOfficeStore();
  const { departments } = useCompanyStore();

  if (!showLabels) return null;

  return (
    <group position={[0, 0, 0]}>
      {INITIAL_DEPARTMENTS.map((dept: InitialDepartmentDefinition) => {
        // Find matching backend department data for dynamic counts
        const backendDept = departments.find(
          (d) => d.slug === dept.slug || d.name.toLowerCase() === dept.name.toLowerCase(),
        );
        const employeeCount = backendDept?._count?.employees || 0;
        const isSelected = selectedZone?.slug === dept.slug;

        return (
          <group
            key={`tag-${dept.slug}`}
            position={[dept.zoneBounds.x, 2.5, dept.zoneBounds.z]}
          >
            <Html center distanceFactor={22} zIndexRange={[100, 0]}>
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
                className={`group cursor-pointer select-none transition-all duration-200 transform hover:scale-105 px-2.5 py-1 rounded-lg backdrop-blur-md border shadow-lg flex items-center gap-2 ${
                  isSelected
                    ? 'bg-slate-900/95 border-cyan-400 ring-2 ring-cyan-500/30'
                    : 'bg-slate-900/80 border-slate-700/80 hover:border-slate-500'
                }`}
              >
                {/* Department Accent Dot */}
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: dept.color }}
                />

                {/* Department Title */}
                <span className="text-xs font-semibold text-slate-100 whitespace-nowrap tracking-wide">
                  {dept.name}
                </span>

                {/* AI Agents Count Pill */}
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono border border-slate-700">
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

