import React from 'react';
import { Workstation } from './Workstation';
import { useCompanyStore } from '../../store/useCompanyStore';

interface OfficeFurnitureProps {
  onSelectAgent?: (employeeId: string) => void;
}

export const OfficeFurniture: React.FC<OfficeFurnitureProps> = ({ onSelectAgent }) => {
  const { employees } = useCompanyStore();

  const getAgent = (deptSlug: string, slotIndex: number) => {
    return (
      employees.find((e) => {
        if (e.workstationId) {
          const ws = e.workstationId.toLowerCase();
          if (ws === `${deptSlug}-${slotIndex}`) return true;
          if (deptSlug === 'technology' && (ws === `ws-tech-${slotIndex}` || ws === `technology-${slotIndex}`)) return true;
          if (deptSlug === 'operations' && (ws === `ws-ops-${slotIndex}` || ws === `operations-${slotIndex}`)) return true;
          if (deptSlug === 'engineering' && (ws === `ws-eng-${slotIndex}` || ws === `engineering-${slotIndex}`)) return true;
          if (deptSlug === 'quality-assurance' && (ws === `ws-qa-${slotIndex}` || ws === `quality-assurance-${slotIndex}`)) return true;
          if (deptSlug === 'research' && (ws === `ws-res-${slotIndex}` || ws === `research-${slotIndex}`)) return true;
        }
        // Fallback: match primary employee of department to slot 1
        if (slotIndex === 1 && (e.department?.slug === deptSlug || (deptSlug === 'operations' && e.employeeCode === 'VAC-OPS-001'))) {
          return true;
        }
        return false;
      }) || null
    );
  };

  return (
    <group position={[0, 0, 0]}>
      {/* ========================================================
          1. TECHNOLOGY ZONE (MARCUS VANCE) - CYAN ACCENTS
         ======================================================== */}
      <Workstation
        position={[-9, 0, -9]}
        rotationY={0}
        screenColor="#66B8C5"
        departmentSlug="technology"
        slotIndex={1}
        assignedAgent={getAgent('technology', 1)}
        onSelectAgent={onSelectAgent}
      />
      <Workstation
        position={[-7, 0, -9]}
        rotationY={0}
        screenColor="#66B8C5"
        departmentSlug="technology"
        slotIndex={2}
        assignedAgent={getAgent('technology', 2)}
        onSelectAgent={onSelectAgent}
      />
      <Workstation
        position={[-9, 0, -7]}
        rotationY={Math.PI}
        screenColor="#66B8C5"
        departmentSlug="technology"
        slotIndex={3}
        assignedAgent={getAgent('technology', 3)}
        onSelectAgent={onSelectAgent}
      />

      {/* Tech Storage Cabinets (Clean White with Natural Wood Doors) */}
      {[-11.5, -12.5].map((xPos, idx) => (
        <group key={`tech-cabinet-${idx}`} position={[xPos, 1.2, -10]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.7, 2.4, 1.2]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.3} metalness={0.1} />
          </mesh>
          {/* Light Wood Doors */}
          {[-0.8, -0.4, 0, 0.4, 0.8].map((yOff, sIdx) => (
            <mesh key={`slot-${sIdx}`} position={[0.36, yOff, 0]}>
              <boxGeometry args={[0.02, 0.32, 1.1]} />
              <meshStandardMaterial color="#DCC6A5" roughness={0.5} />
            </mesh>
          ))}
          {/* Subtle Activity Dot */}
          <mesh position={[0.37, 0.7, 0.4]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshBasicMaterial color="#66B8C5" />
          </mesh>
        </group>
      ))}

      {/* ========================================================
          2. ENGINEERING ZONE (ALEX MERCER) - NATURAL GREEN ACCENTS
         ======================================================== */}
      <Workstation
        position={[-1, 0, -9]}
        rotationY={0}
        screenColor="#79AD78"
        departmentSlug="engineering"
        slotIndex={1}
        assignedAgent={getAgent('engineering', 1)}
        onSelectAgent={onSelectAgent}
      />
      <Workstation
        position={[1, 0, -9]}
        rotationY={0}
        screenColor="#79AD78"
        departmentSlug="engineering"
        slotIndex={2}
        assignedAgent={getAgent('engineering', 2)}
        onSelectAgent={onSelectAgent}
      />
      <Workstation
        position={[-1, 0, -7]}
        rotationY={Math.PI}
        screenColor="#79AD78"
        departmentSlug="engineering"
        slotIndex={3}
        assignedAgent={getAgent('engineering', 3)}
        onSelectAgent={onSelectAgent}
      />
      <Workstation
        position={[1, 0, -7]}
        rotationY={Math.PI}
        screenColor="#79AD78"
        departmentSlug="engineering"
        slotIndex={4}
        assignedAgent={getAgent('engineering', 4)}
        onSelectAgent={onSelectAgent}
      />

      {/* Engineering Architecture Whiteboard */}
      <group position={[3.2, 1.2, -9.5]} rotation={[0, -0.2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.8, 1.3, 0.05]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[1.7, 1.2]} />
          <meshBasicMaterial color="#FAFDFE" />
        </mesh>
        {/* Natural Wood Board Frame */}
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[1.85, 1.35, 0.03]} />
          <meshStandardMaterial color="#DCC6A5" roughness={0.6} />
        </mesh>
      </group>

      {/* ========================================================
          3. RESEARCH ZONE (DR. MAYA PATEL) - LAVENDER & BOOKSHELVES
         ======================================================== */}
      <Workstation
        position={[7, 0, -9]}
        rotationY={0}
        screenColor="#A18BC7"
        departmentSlug="research"
        slotIndex={1}
        assignedAgent={getAgent('research', 1)}
        onSelectAgent={onSelectAgent}
      />
      <Workstation
        position={[9, 0, -9]}
        rotationY={0}
        screenColor="#A18BC7"
        departmentSlug="research"
        slotIndex={2}
        assignedAgent={getAgent('research', 2)}
        onSelectAgent={onSelectAgent}
      />
      <Workstation
        position={[8, 0, -6.5]}
        rotationY={Math.PI}
        screenColor="#A18BC7"
        departmentSlug="research"
        slotIndex={3}
        assignedAgent={getAgent('research', 3)}
        onSelectAgent={onSelectAgent}
      />

      {/* Research Wooden Bookshelves */}
      <group position={[12, 1.3, -9]}>
        {/* Bookshelf Frame (Natural Wood) */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.5, 2.5, 2.2]} />
          <meshStandardMaterial color="#DCC6A5" roughness={0.5} />
        </mesh>
        {/* Shelves & Colorful Book Spines */}
        {[-0.8, -0.2, 0.4, 0.9].map((yOff, sIdx) => (
          <group key={`shelf-${sIdx}`} position={[-0.2, yOff, 0]}>
            <mesh position={[0, -0.02, 0]}>
              <boxGeometry args={[0.42, 0.04, 2.1]} />
              <meshStandardMaterial color="#DCC6A5" roughness={0.4} />
            </mesh>
            {/* Row of Stylized Books */}
            {[-0.8, -0.5, -0.2, 0.1, 0.4, 0.7].map((zBook, bIdx) => {
              const bookColors = ['#A18BC7', '#79AD78', '#66B8C5', '#E99A50', '#D9829D', '#D9B75D'];
              const color = bookColors[(sIdx + bIdx) % bookColors.length];
              return (
                <mesh key={`book-${bIdx}`} position={[0, 0.14, zBook]} castShadow>
                  <boxGeometry args={[0.28, 0.28, 0.14]} />
                  <meshStandardMaterial color={color} roughness={0.7} />
                </mesh>
              );
            })}
          </group>
        ))}
      </group>

      {/* Research Collaboration Stand */}
      <group position={[11, 1.2, -6]} rotation={[0, -Math.PI / 4, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.06, 1.4, 1.8]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[1.7, 1.3]} />
          <meshBasicMaterial color="#FAFDFE" />
        </mesh>
        {/* Light Wood Stand Legs */}
        <mesh position={[0, -0.6, -0.8]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 1.3, 8]} />
          <meshStandardMaterial color="#DCC6A5" />
        </mesh>
        <mesh position={[0, -0.6, 0.8]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 1.3, 8]} />
          <meshStandardMaterial color="#DCC6A5" />
        </mesh>
      </group>

      {/* ========================================================
          4. RECEPTION AREA - CURVED DESK & WELCOME AREA
         ======================================================== */}
      <group position={[-11, 0.55, -2]}>
        {/* Natural Wood Curved Reception Counter Front */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[1.2, 1.2, 1.1, 16, 1, false, -Math.PI / 2, Math.PI]} />
          <meshStandardMaterial color="#DCC6A5" roughness={0.4} />
        </mesh>
        {/* Top White Quartz Countertop */}
        <mesh position={[0, 0.56, 0]} castShadow>
          <cylinderGeometry args={[1.28, 1.28, 0.06, 16, 1, false, -Math.PI / 2, Math.PI]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
        </mesh>
        {/* Reception Desk Bell & iPad Check-in */}
        <mesh position={[-0.2, 0.61, 0.3]} castShadow>
          <boxGeometry args={[0.2, 0.015, 0.15]} />
          <meshStandardMaterial color="#454545" roughness={0.3} />
        </mesh>
        {/* Welcome Sign Badge */}
        <mesh position={[0.7, 0.2, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.5, 0.2, 0.02]} />
          <meshStandardMaterial color="#E99A50" />
        </mesh>
      </group>

      {/* ========================================================
          5. LOUNGE & BREAK AREA - COZY SECTIONAL SOFAS
         ======================================================== */}
      <group position={[-8, 0, 0]}>
        {/* Comfortable L-Shaped Sectional Sofa (Warm Cream Upholstery) */}
        {/* Main Sofa Bench */}
        <mesh position={[0, 0.35, -0.8]} castShadow receiveShadow>
          <boxGeometry args={[2.2, 0.45, 0.9]} />
          <meshStandardMaterial color="#FAF9F6" roughness={0.8} />
        </mesh>
        {/* Sofa Backrest */}
        <mesh position={[0, 0.65, -1.2]} castShadow>
          <boxGeometry args={[2.2, 0.5, 0.25]} />
          <meshStandardMaterial color="#FAF9F6" roughness={0.8} />
        </mesh>
        {/* Side Chaise */}
        <mesh position={[-0.8, 0.35, 0.1]} castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.45, 1.1]} />
          <meshStandardMaterial color="#FAF9F6" roughness={0.8} />
        </mesh>
        {/* Colorful Accent Pillows */}
        <mesh position={[-0.6, 0.55, -0.9]} rotation={[0.2, 0.1, 0.1]} castShadow>
          <boxGeometry args={[0.35, 0.35, 0.15]} />
          <meshStandardMaterial color="#79AD78" roughness={0.7} />
        </mesh>
        <mesh position={[0.4, 0.55, -0.9]} rotation={[0.2, -0.15, -0.1]} castShadow>
          <boxGeometry args={[0.35, 0.35, 0.15]} />
          <meshStandardMaterial color="#E99A50" roughness={0.7} />
        </mesh>

        {/* Natural Wood Coffee Table */}
        <mesh position={[0.2, 0.22, 0.1]} castShadow receiveShadow>
          <boxGeometry args={[1.1, 0.38, 0.65]} />
          <meshStandardMaterial color="#DCC6A5" roughness={0.45} />
        </mesh>
        {/* Table Legs */}
        <mesh position={[-0.25, 0.1, -0.15]}>
          <cylinderGeometry args={[0.025, 0.025, 0.2, 8]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        <mesh position={[0.65, 0.1, 0.35]}>
          <cylinderGeometry args={[0.025, 0.025, 0.2, 8]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        {/* Coffee Table Magazine */}
        <mesh position={[0.1, 0.42, 0.1]}>
          <boxGeometry args={[0.25, 0.015, 0.35]} />
          <meshStandardMaterial color="#E5E1D8" />
        </mesh>

        {/* Warm Reading Floor Lamp */}
        <group position={[1.4, 0, -1.2]}>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.04, 16]} />
            <meshStandardMaterial color="#D9B75D" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.9, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 1.8, 8]} />
            <meshStandardMaterial color="#D9B75D" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 1.75, 0]}>
            <cylinderGeometry args={[0.15, 0.25, 0.35, 16, 1, true]} />
            <meshStandardMaterial color="#FAF9F6" roughness={0.3} />
          </mesh>
          <pointLight position={[0, 1.7, 0]} color="#FFF3E2" intensity={0.35} distance={4} />
        </group>
      </group>

      {/* ========================================================
          6. OPERATIONS ZONE (ELENA ROSTOVA) - WARM ORANGE ACCENTS
         ======================================================== */}
      <Workstation
        position={[-8, 0, 7]}
        rotationY={0}
        screenColor="#E99A50"
        departmentSlug="operations"
        slotIndex={1}
        assignedAgent={getAgent('operations', 1)}
        onSelectAgent={onSelectAgent}
      />
      <Workstation
        position={[-8, 0, 9]}
        rotationY={Math.PI}
        screenColor="#E99A50"
        departmentSlug="operations"
        slotIndex={2}
        assignedAgent={getAgent('operations', 2)}
        onSelectAgent={onSelectAgent}
      />

      {/* Operations Storage & Organization Board */}
      <group position={[-11.5, 1.1, 8]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.5, 2.2, 1.6]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
        </mesh>
        {/* Warm Orange Drawer Accents */}
        {[-0.6, -0.1, 0.4, 0.8].map((yOff, dIdx) => (
          <mesh key={`op-drawer-${dIdx}`} position={[0.26, yOff, 0]}>
            <boxGeometry args={[0.02, 0.35, 1.45]} />
            <meshStandardMaterial color="#E99A50" roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* ========================================================
          7. QUALITY ASSURANCE ZONE (SOPHIA LIN) - SOFT PINK ACCENTS
         ======================================================== */}
      <Workstation
        position={[-1, 0, 8]}
        rotationY={0}
        screenColor="#D9829D"
        departmentSlug="quality-assurance"
        slotIndex={1}
        assignedAgent={getAgent('quality-assurance', 1)}
        onSelectAgent={onSelectAgent}
      />
      <Workstation
        position={[1, 0, 8]}
        rotationY={0}
        screenColor="#D9829D"
        departmentSlug="quality-assurance"
        slotIndex={2}
        assignedAgent={getAgent('quality-assurance', 2)}
        onSelectAgent={onSelectAgent}
      />

      {/* QA Test Device Stand & Quality Verification Bench */}
      <group position={[3.2, 0.8, 8]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.4, 0.76, 0.6]} />
          <meshStandardMaterial color="#DCC6A5" roughness={0.4} />
        </mesh>
        {/* Device Screen Dummies */}
        <mesh position={[-0.3, 0.52, 0]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.25, 0.35, 0.02]} />
          <meshStandardMaterial color="#D9829D" roughness={0.2} />
        </mesh>
        <mesh position={[0.25, 0.48, 0]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.35, 0.25, 0.02]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
        </mesh>
      </group>

      {/* ========================================================
          8. EXECUTIVE MEETING ROOM - GOLD & WOOD CONFERENCE TABLE
         ======================================================== */}
      <group position={[8, 0, 8]}>
        {/* Large Natural Light Oak Executive Conference Table */}
        <mesh position={[0, 0.74, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.06, 1.6]} />
          <meshStandardMaterial color="#DCC6A5" roughness={0.4} metalness={0.05} />
        </mesh>
        {/* Table Pedestals (White Powder-Coated Fluted Columns) */}
        <mesh position={[-0.9, 0.36, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.22, 0.7, 16]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
        </mesh>
        <mesh position={[0.9, 0.36, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.22, 0.7, 16]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
        </mesh>

        {/* Executive Conference Chairs (Warm Cream with Gold Accents) */}
        {[-1, 0, 1].map((xOff, cIdx) => (
          <React.Fragment key={`conf-chair-${cIdx}`}>
            {/* North Chairs */}
            <mesh position={[xOff, 0.44, -1.05]} castShadow>
              <boxGeometry args={[0.42, 0.48, 0.42]} />
              <meshStandardMaterial color="#FAF9F6" roughness={0.7} />
            </mesh>
            {/* South Chairs */}
            <mesh position={[xOff, 0.44, 1.05]} castShadow>
              <boxGeometry args={[0.42, 0.48, 0.42]} />
              <meshStandardMaterial color="#FAF9F6" roughness={0.7} />
            </mesh>
          </React.Fragment>
        ))}

        {/* Executive Presentation Screen */}
        <Workstation
          position={[11, 0, 8]}
          rotationY={-Math.PI / 2}
          screenColor="#D9B75D"
          departmentSlug="administration"
          slotIndex={1}
        />
      </group>

      {/* ========================================================
          9. CENTRAL LIVING ATRIUM & BENCH
         ======================================================== */}
      <group position={[0, 0, 0]}>
        {/* Round Wooden Planter Bench Base */}
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.6, 1.8, 0.5, 24]} />
          <meshStandardMaterial color="#E5E1D8" roughness={0.6} />
        </mesh>
        {/* Natural Wood Bench Seating Ring */}
        <mesh position={[0, 0.52, 0]} castShadow>
          <cylinderGeometry args={[1.8, 1.8, 0.05, 24]} />
          <meshStandardMaterial color="#DCC6A5" roughness={0.4} />
        </mesh>
        {/* Central Terracotta Planter */}
        <mesh position={[0, 0.8, 0]} castShadow>
          <cylinderGeometry args={[0.7, 0.55, 0.6, 18]} />
          <meshStandardMaterial color="#C86D51" roughness={0.8} />
        </mesh>
        {/* Ficus Indoor Tree Foliage (Natural Green #79AD78) */}
        <mesh position={[0, 1.6, 0]} castShadow>
          <sphereGeometry args={[0.85, 14, 14]} />
          <meshStandardMaterial color="#79AD78" roughness={0.8} />
        </mesh>
        <mesh position={[0.2, 2.1, 0.1]} castShadow>
          <sphereGeometry args={[0.65, 12, 12]} />
          <meshStandardMaterial color="#689E67" roughness={0.8} />
        </mesh>
      </group>

      {/* ========================================================
          10. PANTRY: WATER DISPENSER & COFFEE MACHINE
         ======================================================== */}
      {/* Modern Clean White Water Dispenser Station with Blue Jug */}
      <group position={[-3, 0.6, 3]}>
        <mesh castShadow>
          <boxGeometry args={[0.38, 1.2, 0.38]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
        </mesh>
        {/* Blue Water Dispenser Jug */}
        <mesh position={[0, 0.75, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.32, 16]} />
          <meshStandardMaterial
            color="#66B8C5"
            transparent
            opacity={0.7}
            roughness={0.1}
          />
        </mesh>
        {/* Dispenser Water Spigot & Drip Tray */}
        <mesh position={[0, 0.15, 0.15]}>
          <boxGeometry args={[0.22, 0.1, 0.12]} />
          <meshStandardMaterial color="#E5E1D8" />
        </mesh>
      </group>

      {/* Coffee Bar Counter & Espresso Machine */}
      <group position={[3, 0.55, 3]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.2, 1.1, 0.5]} />
          <meshStandardMaterial color="#DCC6A5" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.57, 0]}>
          <boxGeometry args={[1.24, 0.05, 0.54]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
        </mesh>
        {/* Silver/Chrome Espresso Coffee Machine */}
        <mesh position={[0, 0.8, 0]} castShadow>
          <boxGeometry args={[0.38, 0.42, 0.32]} />
          <meshStandardMaterial color="#CBD5E1" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Coffee Cup on Counter */}
        <mesh position={[0.38, 0.65, 0.05]}>
          <cylinderGeometry args={[0.04, 0.035, 0.08, 10]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
      </group>

      {/* ========================================================
          11. LUSH INDOOR CERAMIC PLANTERS ACROSS CORRIDORS
         ======================================================== */}
      {[
        [-13, 0.35, -13],
        [13, 0.35, -13],
        [-13, 0.35, 13],
        [13, 0.35, 13],
        [4, 0.35, -4],
        [-4, 0.35, 4],
      ].map(([px, py, pz], pIdx) => (
        <group key={`planter-${pIdx}`} position={[px, py, pz]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.45, 0.38, 0.7, 16]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.65, 0]} castShadow>
            <sphereGeometry args={[0.5, 12, 12]} />
            <meshStandardMaterial color="#79AD78" roughness={0.8} />
          </mesh>
          <mesh position={[0.12, 0.92, 0.08]} castShadow>
            <sphereGeometry args={[0.35, 10, 10]} />
            <meshStandardMaterial color="#689E67" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
