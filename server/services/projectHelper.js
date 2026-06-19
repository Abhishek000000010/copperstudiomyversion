import mongoose from "mongoose";
import Project from "../models/Project.js";
import Task from "../models/Task.js";

export async function updateProjectProgress(projectId) {
  if (!projectId) return;
  const tasks = await Task.find({ projectId });
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === "completed" || t.status === "Completed").length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  await Project.findByIdAndUpdate(projectId, { progress });
}

export async function populateProjectStages(project, isAdmin) {
  const query = { projectId: project._id };
  if (!isAdmin) {
    query.clientVisible = true;
  }
  const tasks = await Task.find(query).sort({ createdAt: 1 });
  
  // Calculate progress automatically: Completed Tasks / Total Tasks * 100
  const allTasks = await Task.find({ projectId: project._id });
  const total = allTasks.length;
  const completed = allTasks.filter(t => t.status === "completed" || t.status === "Completed").length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  // Update progress in the database if it doesn't match
  if (project.progress !== progress) {
    project.progress = progress;
    await project.save();
  }
  
  const projectObj = project.toObject ? project.toObject() : project;
  projectObj.stages = tasks.map(t => ({
    _id: t._id.toString(),
    id: t._id.toString(),
    name: t.title,
    status: t.status,
    startDate: t.startDate,
    endDate: t.endDate,
    notes: t.description,
    clientVisible: t.clientVisible,
    internalNotes: t.internalNotes || ""
  }));
  
  return projectObj;
}

export async function syncProjectStagesToTasks(project, stages) {
  if (!stages) return;
  
  // Get all existing tasks for this project
  const existingTasks = await Task.find({ projectId: project._id });
  const existingIds = existingTasks.map(t => t._id.toString());
  
  const submittedIds = [];
  
  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    const stageId = stage._id || stage.id;
    
    const taskData = {
      title: stage.name || "Untitled Stage",
      project: project.name,
      projectId: project._id,
      status: stage.status || "pending",
      startDate: stage.startDate ? new Date(stage.startDate).toISOString() : "",
      endDate: stage.endDate ? new Date(stage.endDate).toISOString() : "",
      description: stage.notes || "", // Description maps to stage notes (visible to client)
      clientVisible: stage.clientVisible ?? true,
      internalNotes: stage.internalNotes || "",
      priority: "Medium",
      assignee: "A"
    };
    
    if (stageId && existingIds.includes(stageId.toString())) {
      // Update existing task
      submittedIds.push(stageId.toString());
      await Task.findByIdAndUpdate(stageId, taskData);
    } else {
      // Create new task
      const newTask = await Task.create({
        id: `TASK-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        ...taskData
      });
      submittedIds.push(newTask._id.toString());
    }
  }
  
  // Delete any existing tasks that were not submitted in the stages array
  for (const existingTask of existingTasks) {
    if (!submittedIds.includes(existingTask._id.toString())) {
      await Task.findByIdAndDelete(existingTask._id);
    }
  }
  
  // Recalculate project progress
  await updateProjectProgress(project._id);
}
