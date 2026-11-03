  import React, { useState, useRef } from 'react';
import { OFFICE_LAYOUT, ZoneConfig, FurnitureItem, DeskConfig } from './officeLayoutConfig';
import { useCompanyStore } from '../../store/useCompanyStore';
import { useOfficeStore } from '../../store/useOfficeStore';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface OfficeMap2DProps {
  onSelectEmployee?: (employeeId: string) => void;
  selectedEmployeeId?: string | null;
  onSelectZone?: (zoneId: string) => void;
}

export const OfficeMap2D: React.FC<OfficeMap2DProps> = ({
  onSelectEmployee,
  selectedEmployeeId,
  onSelectZone,
}) => {
  const { employees } = useCompanyStore();
  const { employeeLifeStates, employeeNeeds } = useOfficeStore();

  // Zoom & Pan transformation state
  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeHoverZone, setActiveHoverZone] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fit to screen helper
  const handleFitToScreen = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 2.8));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.6));
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.1 : -0.1;
    setScale((prev) => Math.min(Math.max(prev + zoomFactor, 0.6), 2.8));
  };

  // Pan dragging handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag on left click and when clicking background
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Count employees in a given zone based on real database records
  const getZoneEmployeeCount = (zone: ZoneConfig): number => {
    if (!zone.departmentSlug) return 0;
    const targetSlug = zone.departmentSlug;
    return employees.filter((emp) => {
      const deptSlug = emp.department?.slug?.toLowerCase() || '';
      const workstation = (emp.workstationId || '').toLowerCase();
      return (
        deptSlug === targetSlug ||
        workstation.includes(targetSlug) ||
        (targetSlug === 'operations' && (deptSlug === 'executive' || deptSlug === 'operations'))
      );
    }).length;
  };

  // Render minimal geometric furniture
  const renderFurniture = (item: FurnitureItem, key: string) => {
    switch (item.type) {
      case 'desk':
        return (
          <rect
            key={key}
            x={item.x}
            y={item.y}
            width={item.width || 80}
            height={item.height || 45}
            rx={4}
            fill="#1E222B"
            stroke="#2A2F3A"
            strokeWidth={1}
          />
        );
      case 'table':
        return (
          <g key={key}>
            <rect
              x={item.x}
              y={item.y}
              width={item.width || 100}
              height={item.height || 40}
              rx={6}
              fill="#1B1E26"
              stroke="#2E3442"
              strokeWidth={1}
            />
            {item.label && (
              <text
                x={item.x + (item.width || 100) / 2}
                y={item.y + (item.height || 40) / 2 + 3}
                fill="#6B7280"
                fontSize={9}
                textAnchor="middle"
                className="select-none pointer-events-none"
              >
                {item.label}
              </text>
            )}
          </g>
        );
      case 'sofa':
        return (
          <rect
            key={key}
            x={item.x}
            y={item.y}
            width={item.width || 120}
            height={item.height || 40}
            rx={8}
            fill="#222733"
            stroke="#2F3646"
            strokeWidth={1}
          />
        );
      case 'counter':
        return (
          <g key={key}>
            <rect
              x={item.x}
              y={item.y}
              width={item.width || 160}
              height={item.height || 30}
              rx={4}
              fill="#1F232E"
              stroke="#2C3240"
              strokeWidth={1}
            />
            {item.label && (
              <text
                x={item.x + 12}
                y={item.y + 18}
                fill="#787F8E"
                fontSize={10}
                fontWeight={500}
                className="select-none pointer-events-none"
              >
                {item.label}
              </text>
            )}
          </g>
        );
      case 'chair':
        return (
          <circle
            key={key}
            cx={item.x}
            cy={item.y}
            r={item.radius || 8}
            fill="#272D3B"
            stroke="#363E50"
            strokeWidth={1}
          />
        );
      case 'plant':
        return (
          <g key={key}>
            {/* Outer planter shadow */}
            <circle
              cx={item.x}
              cy={item.y}
              r={(item.radius || 14) + 3}
              fill="rgba(16, 185, 129, 0.08)"
            />
            {/* Pot */}
            <circle
              cx={item.x}
              cy={item.y}
              r={item.radius || 14}
              fill="#162E25"
              stroke="#10B981"
              strokeWidth={1}
              strokeOpacity={0.4}
            />
            {/* Plant leaf layers */}
            <circle
              cx={item.x - 2}
              cy={item.y - 2}
              r={(item.radius || 14) * 0.65}
              fill="#10B981"
              fillOpacity={0.65}
            />
            <circle
              cx={item.x + 2}
              cy={item.y + 2}
              r={(item.radius || 14) * 0.4}
              fill="#34D399"
              fillOpacity={0.8}
            />
          </g>
        );
      default:
        return null;
    }
  };

  // Render workstation desk with monitor and subtle mousepad
  const renderDesk = (desk: DeskConfig) => {
    return (
      <g key={desk.id}>
        {/* Desk Surface */}
        <rect
          x={desk.x}
          y={desk.y}
          width={desk.width}
          height={desk.height}
          rx={5}
          fill="#1C2029"
          stroke="#2A303F"
          strokeWidth={1}
        />
        {/* Monitor Stand & Screen Line */}
        <rect
          x={desk.x + desk.width / 2 - 20}
          y={desk.y + 8}
          width={40}
          height={4}
          rx={1}
          fill="#475569"
        />
        <line
          x1={desk.x + desk.width / 2}
          y1={desk.y + 12}
          x2={desk.x + desk.width / 2}
          y2={desk.y + 17}
          stroke="#475569"
          strokeWidth={2}
        />
        {/* Minimal Desk Pad */}
        <rect
          x={desk.x + desk.width / 2 - 16}
          y={desk.y + 20}
          width={32}
          height={18}
          rx={2}
          fill="#14171F"
          stroke="#262C3A"
          strokeWidth={0.5}
        />
        {/* Minimal Desk Label */}
        <text
          x={desk.x + desk.width / 2}
          y={desk.y + desk.height - 5}
          fill="#64748B"
          fontSize={8}
          textAnchor="middle"
          className="select-none pointer-events-none font-mono"
        >
          {desk.label}
        </text>
      </g>
    );
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden select-none bg-[#0F1115] text-[#E6E8EC]"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: isDragging ? 'grabbing' : 'default' }}
    >
      {/* HUD Floating Quick Navigation & Zoom Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 p-1 rounded-xl bg-[#171A21]/90 border border-[#2A2F3A] backdrop-blur-md shadow-lg">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2 rounded-lg text-[#9AA1AF] hover:text-[#E6E8EC] hover:bg-[#1E222B] transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2 rounded-lg text-[#9AA1AF] hover:text-[#E6E8EC] hover:bg-[#1E222B] transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-[#2A2F3A] mx-0.5" />
        <button
          onClick={handleFitToScreen}
          title="Fit to Screen"
          className="p-2 rounded-lg text-[#9AA1AF] hover:text-[#E6E8EC] hover:bg-[#1E222B] transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main Vector Architectural SVG Map */}
      <svg
        viewBox="0 0 1600 1000"
        className="w-full h-full"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 180ms ease-out',
        }}
      >
        <defs>
          {/* Subtle Grid Pattern for Technical Precision */}
          <pattern id="officeGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1A1E27" strokeWidth="0.5" />
          </pattern>
        </defs>

        {/* Outer Canvas Background Grid */}
        <rect x="0" y="0" width="1600" height="1000" fill="#0F1115" />
        <rect x="0" y="0" width="1600" height="1000" fill="url(#officeGrid)" opacity="0.6" />

        {/* Main Building Outer Shell Floor & Wall */}
        <rect
          x={OFFICE_LAYOUT.outerWall.x}
          y={OFFICE_LAYOUT.outerWall.y}
          width={OFFICE_LAYOUT.outerWall.width}
          height={OFFICE_LAYOUT.outerWall.height}
          rx={OFFICE_LAYOUT.outerWall.radius}
          fill="#13161D"
          stroke="#2A2F3A"
          strokeWidth={2}
        />

        {/* Walkway Corridors (Soft Subtle Tone) */}
        {/* Horizontal Walkways */}
        <rect x="50" y="325" width="1500" height="20" fill="#171A22" />
        <rect x="50" y="625" width="1500" height="20" fill="#171A22" />
        {/* Vertical Walkways */}
        <rect x="405" y="50" width="20" height="900" fill="#171A22" />
        <rect x="1175" y="50" width="20" height="900" fill="#171A22" />

        {/* Render Each Zone / Room */}
        {OFFICE_LAYOUT.zones.map((zone) => {
          const isHovered = activeHoverZone === zone.id;
          const agentCount = getZoneEmployeeCount(zone);

          return (
            <g
              key={zone.id}
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setActiveHoverZone(zone.id)}
              onMouseLeave={() => setActiveHoverZone(null)}
              onClick={() => onSelectZone?.(zone.id)}
            >
              {/* Room Floor Surface */}
              <rect
                x={zone.x}
                y={zone.y}
                width={zone.width}
                height={zone.height}
                rx={10}
                fill="#171A21"
                stroke={isHovered ? zone.accentColor : '#2A2F3A'}
                strokeWidth={isHovered ? 1.5 : 1}
              />

              {/* Subtle Room Accent Tint */}
              <rect
                x={zone.x + 1}
                y={zone.y + 1}
                width={zone.width - 2}
                height={zone.height - 2}
                rx={9}
                fill={zone.accentTintDark}
                opacity={isHovered ? 1.5 : 1}
              />

              {/* Architectural Doorway Cutout Indicator */}
              <rect
                x={zone.door.side === 'left' || zone.door.side === 'right' ? zone.door.x - 2 : zone.door.x}
                y={zone.door.side === 'top' || zone.door.side === 'bottom' ? zone.door.y - 2 : zone.door.y}
                width={zone.door.side === 'left' || zone.door.side === 'right' ? 4 : zone.door.width}
                height={zone.door.side === 'top' || zone.door.side === 'bottom' ? 4 : zone.door.width}
                fill="#13161D"
              />

              {/* Zone Header Label in Corner */}
              <g transform={`translate(${zone.x + 14}, ${zone.y + 20})`}>
                {/* Accent Color Dot */}
                <circle cx={4} cy={-4} r={3.5} fill={zone.accentColor} />
                {/* Zone Title */}
                <text
                  x={14}
                  y={0}
                  fill="#E6E8EC"
                  fontSize={11}
                  fontWeight={600}
                  letterSpacing="0.06em"
                  className="select-none uppercase font-sans"
                >
                  {zone.name}
                </text>
                {/* Agent Count Badge */}
                {agentCount > 0 && (
                  <g transform={`translate(${zone.width - 56}, -11)`}>
                    <rect
                      x={0}
                      y={0}
                      width={28}
                      height={16}
                      rx={8}
                      fill={zone.accentColor}
                      fillOpacity={0.16}
                      stroke={zone.accentColor}
                      strokeWidth={0.8}
                    />
                    <text
                      x={14}
                      y={11.5}
                      fill={zone.accentColor}
                      fontSize={9}
                      fontWeight={700}
                      textAnchor="middle"
                      className="select-none font-mono"
                    >
                      {agentCount}
                    </text>
                  </g>
                )}
              </g>

              {/* Furniture in Room */}
              {zone.furniture.map((item, idx) =>
                renderFurniture(item, `${zone.id}-furn-${idx}`),
              )}

              {/* Desks in Room */}
              {zone.desks.map((desk) => renderDesk(desk))}
            </g>
          );
        })}

        {/* =========================================================
            RENDER AI EMPLOYEES ON FLOORPLAN (Sprint 7 Real-time Life State)
           ========================================================= */}
        {employees.map((emp) => {
          const life = employeeLifeStates[emp.id];
          const needs = employeeNeeds[emp.id];
          const behavior = life?.behavior || 'IDLE';
          const isSelected = selectedEmployeeId === emp.id;

          // Determine position based on current location and behavior
          let posX = 800;
          let posY = 500;

          if (behavior === 'DRINKING' || life?.currentLocationId === 'water_dispenser') {
            posX = 1240;
            posY = 390;
          } else if (behavior === 'EATING' || life?.currentLocationId === 'pantry') {
            posX = 1320;
            posY = 460;
          } else if (behavior === 'RESTING' || life?.currentLocationId === 'lounge') {
            posX = 180;
            posY = 460;
          } else if (behavior === 'SOCIALIZING' || life?.currentLocationId === 'atrium') {
            posX = 740;
            posY = 460;
          } else {
            // Assigned Workstation
            const code = (emp.employeeCode || emp.role || '').toUpperCase();
            if (code.includes('OPS') || code.includes('ELENA')) {
              posX = 525;
              posY = 805;
            } else if (code.includes('TECH') || code.includes('MARCUS')) {
              posX = 525;
              posY = 205;
            } else if (code.includes('ENG') || code.includes('ALEX')) {
              posX = 905;
              posY = 205;
            } else if (code.includes('RES') || code.includes('MAYA')) {
              posX = 1295;
              posY = 205;
            } else if (code.includes('QA') || code.includes('SOPHIA')) {
              posX = 905;
              posY = 805;
            }
          }

          // Role accent colors
          let roleColor = '#06B6D4';
          const r = emp.role.toUpperCase();
          if (r.includes('OPERATING') || r.includes('CHIEF OF STAFF')) roleColor = '#F59E0B';
          else if (r.includes('TECHNOLOGY') || r.includes('CTO')) roleColor = '#06B6D4';
          else if (r.includes('SOFTWARE') || r.includes('ENGINEER')) roleColor = '#10B981';
          else if (r.includes('RESEARCH')) roleColor = '#8B5CF6';
          else if (r.includes('QA') || r.includes('QUALITY')) roleColor = '#EC4899';

          // Status colors
          let statusRingColor = '#64748B';
          if (behavior === 'WORKING') statusRingColor = '#10B981';
          else if (behavior === 'DRINKING') statusRingColor = '#06B6D4';
          else if (behavior === 'EATING') statusRingColor = '#F59E0B';
          else if (behavior === 'RESTING') statusRingColor = '#8B5CF6';
          else if (behavior === 'SOCIALIZING') statusRingColor = '#EC4899';
          else if (behavior === 'WALKING' || behavior === 'RETURNING_TO_DESK') statusRingColor = '#FBBF24';

          const initials = `${emp.firstName[0]}${emp.lastName[0]}`;

          return (
            <g
              key={emp.id}
              transform={`translate(${posX}, ${posY})`}
              className="cursor-pointer transition-transform duration-300"
              onClick={(e) => {
                e.stopPropagation();
                onSelectEmployee?.(emp.id);
              }}
            >
              {/* Outer Selection or Action Pulse Ring */}
              {(isSelected || behavior !== 'IDLE') && (
                <circle
                  cx={0}
                  cy={0}
                  r={24}
                  fill="none"
                  stroke={statusRingColor}
                  strokeWidth={1.5}
                  strokeOpacity={0.6}
                  className="animate-pulse"
                />
              )}

              {/* Status Ring */}
              <circle
                cx={0}
                cy={0}
                r={19}
                fill="#171A21"
                stroke={statusRingColor}
                strokeWidth={2.5}
              />

              {/* Avatar Body */}
              <circle
                cx={0}
                cy={0}
                r={16}
                fill={roleColor}
                fillOpacity={0.2}
              />

              {/* Initials */}
              <text
                x={0}
                y={4}
                fill="#E6E8EC"
                fontSize={10}
                fontWeight={700}
                textAnchor="middle"
                className="select-none font-sans"
              >
                {initials}
              </text>

              {/* Name & Behavior Pill under Avatar */}
              <g transform="translate(0, 24)">
                {/* Name */}
                <text
                  x={0}
                  y={6}
                  fill="#E6E8EC"
                  fontSize={10}
                  fontWeight={600}
                  textAnchor="middle"
                  className="select-none font-sans"
                >
                  {emp.firstName} {emp.lastName}
                </text>
                {/* Behavior & Mood Label */}
                <text
                  x={0}
                  y={17}
                  fill={statusRingColor}
                  fontSize={8}
                  fontWeight={600}
                  textAnchor="middle"
                  className="select-none font-mono"
                >
                  {behavior} {needs?.mood !== undefined ? `• ${Math.round(needs.mood)}%` : ''}
                </text>
              </g>

              {/* Thought Bubble above Avatar if exists */}
              {life?.currentThought && (
                <g transform="translate(0, -32)" className="select-none pointer-events-none">
                  <rect
                    x={-80}
                    y={-12}
                    width={160}
                    height={20}
                    rx={10}
                    fill="#1E222B"
                    stroke={statusRingColor}
                    strokeWidth={0.8}
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
                  />
                  <text
                    x={0}
                    y={1.5}
                    fill="#E6E8EC"
                    fontSize={8.5}
                    fontStyle="italic"
                    textAnchor="middle"
                    className="font-sans truncate"
                  >
                    “{life.currentThought.slice(0, 32)}...”
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};