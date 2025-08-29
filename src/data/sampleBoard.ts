import { Board } from '@/types/kanban';

export const sampleBoard: Board = {
  id: 'board-1',
  title: 'Project Roadmap',
  columns: [
    {
      id: 'todo',
      title: 'To Do',
      order: 0,
      cards: [
        {
          id: 'card-1',
          title: 'Design new landing page',
          description: 'Create a modern, responsive landing page with improved user experience and conversion optimization.',
          dueDate: '2024-01-15',
          assignees: ['Alice', 'Bob'],
          columnId: 'todo',
          order: 0,
          createdAt: '2024-01-01T10:00:00Z'
        },
        {
          id: 'card-2',
          title: 'User research interviews',
          description: 'Conduct 10 user interviews to understand pain points and feature requests.',
          dueDate: '2024-01-20',
          assignees: ['Charlie'],
          columnId: 'todo',
          order: 1,
          createdAt: '2024-01-02T14:30:00Z'
        },
        {
          id: 'card-3',
          title: 'API documentation update',
          description: 'Update API documentation with new endpoints and examples.',
          assignees: ['David', 'Eve'],
          columnId: 'todo',
          order: 2,
          createdAt: '2024-01-03T09:15:00Z'
        }
      ]
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      order: 1,
      cards: [
        {
          id: 'card-4',
          title: 'Mobile app optimization',
          description: 'Improve app performance and reduce loading times by 30%.',
          dueDate: '2024-01-18',
          assignees: ['Frank', 'Grace'],
          columnId: 'in-progress',
          order: 0,
          createdAt: '2024-01-04T11:20:00Z'
        },
        {
          id: 'card-5',
          title: 'Database migration',
          description: 'Migrate user data to new database structure with improved security.',
          dueDate: '2024-01-12',
          assignees: ['Henry'],
          columnId: 'in-progress',
          order: 1,
          createdAt: '2024-01-05T16:45:00Z'
        }
      ]
    },
    {
      id: 'review',
      title: 'Review',
      order: 2,
      cards: [
        {
          id: 'card-6',
          title: 'Security audit',
          description: 'Complete security audit of authentication system and user data handling.',
          assignees: ['Ivy', 'Jack'],
          columnId: 'review',
          order: 0,
          createdAt: '2024-01-06T08:00:00Z'
        }
      ]
    },
    {
      id: 'done',
      title: 'Done',
      order: 3,
      cards: [
        {
          id: 'card-7',
          title: 'Setup CI/CD pipeline',
          description: 'Automated testing and deployment pipeline is now fully operational.',
          assignees: ['Kevin', 'Laura'],
          columnId: 'done',
          order: 0,
          createdAt: '2023-12-28T13:30:00Z'
        },
        {
          id: 'card-8',
          title: 'Team onboarding guide',
          description: 'Comprehensive guide for new team members with setup instructions and best practices.',
          assignees: ['Mike'],
          columnId: 'done',
          order: 1,
          createdAt: '2023-12-30T10:15:00Z'
        }
      ]
    }
  ]
};