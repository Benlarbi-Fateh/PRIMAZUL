// components/Tasks/ProjectSidebarClient.jsx
"use client";

import dynamic from 'next/dynamic';

const ProjectSidebar = dynamic(
  () => import('./ProjectSidebar'),
  { ssr: false }
);

export default ProjectSidebar;