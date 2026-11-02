import React from 'react';
import { Workstation } from './Workstation';

export const OfficeFurniture: React.FC = () => {
  return (
    <group position={[0, 0, 0]}>
      {/* ========================================================
          1. TECHNOLOGY ZONE WORKSTATIONS & SERVER RACKS
         ======================================================== */}
      {/* Workstation Cluster (Tech) */}
      <Workstation
        position={[-9, 0, -9]}
        rotationY={0}
        screenColor="#38bdf8"
        departmentSlug="technology"
        slotIndex={1}
      />
      <Workstation
        position={[-7, 0, -9]}
        rotationY={0}
        screenColor="#38bdf8"
        departmentSlug="technology"
        slotIndex={2}
      />
      <Workstation
        position={[-9, 0, -7]}
        rotationY={Math.PI}
        screenColor="#06b6d4"
        departmentSlug="technology"
        slotIndex={3}
      />

      {/* High-Performance Server Racks in Tech Hub */}
      {[-11.5, -12.5].map((xPos, idx) => (
        <group key={`server-${idx}`} position={[xPos, 1.2, -10]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.7, 2.4, 1.2]} />
            <meshStandardMaterial color="#020617" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Server Unit Panels */}
          {[-0.8, -0.4, 0, 0.4, 0.8].map((yOff, sIdx) => (
            <mesh key={`slot-${sIdx}`} position={[0.36, yOff, 0]}>
              <boxGeometry args={[0.02, 0.28, 1.1]} />
              <meshStandardMaterial color="#0f172a" roughness={0.4} />
            </mesh>
          ))}
          {/* Pulsing Server Status LEDs */}
          <mesh position={[0.38, 0.6, 0.4]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshBasicMaterial color="#10b981" />
          </mesh>
          <mesh position={[0.38, 0.2, 0.4]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshBasicMaterial color="#06b6d4" />
          </mesh>
          <pointLight position={[0.5, 0.5, 0]} color="#06b6d4" intensity={0.5} distance={2.5} />
        </group>
      ))}

      {/* ========================================================
          2. ENGINEERING ZONE WORKSTATIONS
         ======================================================== */}
      <Workstation
        position={[-1, 0, -9]}
        rotationY={0}
        screenColor="#10b981"
        departmentSlug="engineering"
        slotIndex={1}
      />
      <Workstation
        position={[1, 0, -9]}
        rotationY={0}
        screenColor="#10b981"
        departmentSlug="engineering"
        slotIndex={2}
      />
      <Workstation
        position={[-1, 0, -7]}
        rotationY={Math.PI}
        screenColor="#10b981"
        departmentSlug="engineering"
        slotIndex={3}
      />
      <Workstation
        position={[1, 0, -7]}
        rotationY={Math.PI}
        screenColor="#10b981"
        departmentSlug="engineering"
        slotIndex={4}
      />

      {/* ========================================================
          3. RESEARCH ZONE WORKSTATIONS
         ======================================================== */}
      <Workstation
        position={[7, 0, -9]}
        rotationY={0}
        screenColor="#8b5cf6"
        departmentSlug="research"
        slotIndex={1}
      />
      <Workstation
        position={[9, 0, -9]}
        rotationY={0}
        screenColor="#a855f7"
        departmentSlug="research"
        slotIndex={2}
      />
      <Workstation
        position={[8, 0, -6.5]}
        rotationY={Math.PI}
        screenColor="#c084fc"
        departmentSlug="research"
        slotIndex={3}
      />

      {/* ========================================================
          4. BUSINESS ANALYSIS ZONE WORKSTATIONS
         ======================================================== */}
      <Workstation
        position={[-8, 0, -1]}
        rotationY={Math.PI / 2}
        screenColor="#f59e0b"
        departmentSlug="business-analysis"
        slotIndex={1}
      />
      <Workstation
        position={[-8, 0, 1]}
        rotationY={Math.PI / 2}
        screenColor="#f59e0b"
        departmentSlug="business-analysis"
        slotIndex={2}
      />

      {/* ========================================================
          5. CREATIVE ZONE WORKSTATIONS & CANVAS DISPLAY
         ======================================================== */}
      <Workstation
        position={[8, 0, -1]}
        rotationY={-Math.PI / 2}
        screenColor="#ec4899"
        departmentSlug="creative"
        slotIndex={1}
      />
      <Workstation
        position={[8, 0, 1]}
        rotationY={-Math.PI / 2}
        screenColor="#f43f5e"
        departmentSlug="creative"
        slotIndex={2}
      />
      {/* Large Creative Design Display Board */}
      <mesh position={[11, 1.5, 0]} castShadow>
        <boxGeometry args={[0.08, 1.6, 2.8]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[10.95, 1.5, 0]}>
        <planeGeometry args={[2.6, 1.4]} />
        <meshBasicMaterial color="#ec4899" />
      </mesh>

      {/* ========================================================
          6. OPERATIONS ZONE WORKSTATIONS
         ======================================================== */}
      <Workstation
        position={[-8, 0, 7]}
        rotationY={0}
        screenColor="#06b6d4"
        departmentSlug="operations"
        slotIndex={1}
      />
      <Workstation
        position={[-8, 0, 9]}
        rotationY={Math.PI}
        screenColor="#06b6d4"
        departmentSlug="operations"
        slotIndex={2}
      />

      {/* ========================================================
          7. QUALITY ASSURANCE ZONE WORKSTATIONS
         ======================================================== */}
      <Workstation
        position={[-1, 0, 8]}
        rotationY={0}
        screenColor="#ef4444"
        departmentSlug="quality-assurance"
        slotIndex={1}
      />
      <Workstation
        position={[1, 0, 8]}
        rotationY={0}
        screenColor="#ef4444"
        departmentSlug="quality-assurance"
        slotIndex={2}
      />

      {/* ========================================================
          8. ADMINISTRATION & EXECUTIVE CONFERENCE ROOM
         ======================================================== */}
      {/* Executive Conference Table */}
      <group position={[8, 0, 8]}>
        {/* Large Table Top */}
        <mesh position={[0, 0.74, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.08, 1.6]} />
          <meshStandardMaterial color="#1e1b4b" roughness={0.3} metalness={0.2} />
        </mesh>
        {/* Table Pedestals */}
        <mesh position={[-0.9, 0.36, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.7, 16]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} />
        </mesh>
        <mesh position={[0.9, 0.36, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.7, 16]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} />
        </mesh>

        {/* Executive Conference Chairs */}
        {[-1, 0, 1].map((xOff, cIdx) => (
          <React.Fragment key={`conf-chair-${cIdx}`}>
            {/* North Chairs */}
            <mesh position={[xOff, 0.45, -1.1]} castShadow>
              <boxGeometry args={[0.42, 0.5, 0.42]} />
              <meshStandardMaterial color="#312e81" roughness={0.6} />
            </mesh>
            {/* South Chairs */}
            <mesh position={[xOff, 0.45, 1.1]} castShadow>
              <boxGeometry args={[0.42, 0.5, 0.42]} />
              <meshStandardMaterial color="#312e81" roughness={0.6} />
            </mesh>
          </React.Fragment>
        ))}

        {/* Executive GLB Mount Anchor */}
        <Workstation
          position={[11, 0, 8]}
          rotationY={-Math.PI / 2}
          screenColor="#6366f1"
          departmentSlug="administration"
          slotIndex={1}
        />
      </group>

      {/* ========================================================
          CENTRAL AI CORE NODE (Holographic Nexus Pillar)
         ======================================================== */}
      <group position={[0, 0, 0]}>
        {/* Core Pedestal Base */}
        <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.2, 1.4, 0.6, 24]} />
          <meshStandardMaterial color="#090d16" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Hologram Emitter Ring */}
        <mesh position={[0, 0.62, 0]}>
          <ringGeometry args={[0.6, 1.1, 24]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        {/* Central Core Crystal */}
        <mesh position={[0, 1.4, 0]}>
          <octahedronGeometry args={[0.4, 0]} />
          <meshStandardMaterial
            color="#06b6d4"
            roughness={0.1}
            metalness={0.8}
            transparent
            opacity={0.85}
          />
        </mesh>
        <pointLight position={[0, 1.6, 0]} color="#38bdf8" intensity={1.5} distance={5} />
      </group>

      {/* ========================================================
          OFFICE AMENITIES & DECORATIVE PLANTERS
         ======================================================== */}
      {/* Planter Box in Corner */}
      {[
        [-13, 0.3, -13],
        [13, 0.3, -13],
        [-13, 0.3, 13],
        [13, 0.3, 13],
      ].map(([px, py, pz], pIdx) => (
        <group key={`planter-${pIdx}`} position={[px, py, pz]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.2, 0.6, 1.2]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          {/* Foliage Spheres */}
          <mesh position={[0, 0.5, 0]} castShadow>
            <sphereGeometry args={[0.5, 12, 12]} />
            <meshStandardMaterial color="#059669" roughness={0.9} />
          </mesh>
          <mesh position={[0.2, 0.7, 0.1]} castShadow>
            <sphereGeometry args={[0.35, 10, 10]} />
            <meshStandardMaterial color="#10b981" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Water Cooler / Coffee Station (Operations / Central Corridor) */}
      <group position={[-3, 0.6, 3]}>
        <mesh castShadow>
          <boxGeometry args={[0.4, 1.2, 0.4]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.4} />
        </mesh>
        {/* Water Bottle Dome */}
        <mesh position={[0, 0.75, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.35, 12]} />
          <meshStandardMaterial
            color="#38bdf8"
            transparent
            opacity={0.6}
            roughness={0.1}
          />
        </mesh>
      </group>
    </group>
  );
};

