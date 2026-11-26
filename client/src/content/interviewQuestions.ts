import type { InterviewQuestion, InterviewTrack } from '../types/interview'

export const interviewTrackLabels: Record<InterviewTrack, string> = {
  behavioral: 'Behavioral (STAR)',
  'system-design': 'System Design',
  'role-salary': 'Role & Salary',
}

export const interviewQuestions: Record<InterviewTrack, InterviewQuestion[]> = {
  behavioral: [
    { id: 'remote-deadline', prompt: 'Tell me about a time you worked with a remote team to deliver a software project under a tight deadline.' },
    { id: 'production-incident', prompt: 'Tell me about a production incident you helped resolve. What was your role and what changed afterward?' },
    { id: 'team-disagreement', prompt: 'Describe a disagreement with a teammate about a technical decision. How did you handle it remotely?' },
    { id: 'process-improvement', prompt: 'Tell me about a change you made that improved your team’s software delivery or reliability.' },
    { id: 'feedback', prompt: 'Describe a time you received difficult feedback. What did you do, and what did you learn?' },
  ],
  'system-design': [
    { id: 'observability', prompt: 'How would you design a logging and monitoring service that helps a distributed remote team investigate production issues?' },
    { id: 'rate-limiter', prompt: 'How would you design a rate limiter for our public REST API to handle 10,000 requests per second?' },
    { id: 'deployment-pipeline', prompt: 'Design a reliable CI/CD pipeline for a service used by customers in several regions. How would you reduce deployment risk?' },
    { id: 'data-sync', prompt: 'How would you design a service that keeps user data consistent across multiple application instances?' },
    { id: 'latency', prompt: 'An API endpoint has become slow as traffic grows. How would you investigate and improve its response time?' },
  ],
  'role-salary': [
    { id: 'compensation', prompt: 'What are your compensation expectations for a full-time remote engineering role paid in US dollars?' },
    { id: 'async-communication', prompt: 'How do you keep teammates informed and make progress when you work across time zones?' },
    { id: 'role-fit', prompt: 'Which parts of this remote software engineering role best match your experience and strengths?' },
    { id: 'availability', prompt: 'How do you plan your working hours and availability when collaborating with a US-based team?' },
    { id: 'career-goals', prompt: 'What would you like to learn or contribute during your first year in this role?' },
  ],
}
