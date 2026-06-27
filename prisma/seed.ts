import { PrismaClient, Plan, UserRole, UserStatus, MemberStatus, PostType, TaskStatus, Priority, Interval } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing data
  await prisma.$transaction([
    prisma.activityLog.deleteMany(),
    prisma.aIInsight.deleteMany(),
    prisma.task.deleteMany(),
    prisma.workflow.deleteMany(),
    prisma.message.deleteMany(),
    prisma.memberActivity.deleteMany(),
    prisma.courseProgress.deleteMany(),
    prisma.lesson.deleteMany(),
    prisma.module.deleteMany(),
    prisma.course.deleteMany(),
    prisma.eventRSVP.deleteMany(),
    prisma.event.deleteMany(),
    prisma.post.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.product.deleteMany(),
    prisma.member.deleteMany(),
    prisma.tier.deleteMany(),
    prisma.user.deleteMany(),
    prisma.tenantSettings.deleteMany(),
    prisma.tenant.deleteMany(),
  ]);

  console.log('Existing data cleaned.');

  // 2. Create Default Tenant
  const tenant = await prisma.tenant.create({
    data: {
      slug: 'fitness-coaching',
      name: 'Alex Fitness Academy',
      description: 'The ultimate community for fitness, strength, and longevity coaching.',
      primaryColor: '#6366F1',
      plan: Plan.GROWTH,
      status: 'ACTIVE',
    },
  });

  await prisma.tenantSettings.create({
    data: {
      tenantId: tenant.id,
      brandColor: '#6366F1',
      welcomeMessage: 'Welcome to the Alex Fitness Academy! Get ready to crush your goals.',
    },
  });

  console.log(`Created Tenant: ${tenant.name} (${tenant.id})`);

  // 3. Create Creator and Team Users
  const creator = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'alex@fitnessacademy.com',
      name: 'Alex Johnson',
      role: UserRole.CREATOR,
      status: UserStatus.ACTIVE,
    },
  });

  const moderator = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'jordan@fitnessacademy.com',
      name: 'Jordan Smith',
      role: UserRole.COMMUNITY_MANAGER,
      status: UserStatus.ACTIVE,
    },
  });

  console.log(`Created Users: ${creator.name} (Creator), ${moderator.name} (Manager)`);

  // 4. Create Membership Tiers
  const freeTier = await prisma.tier.create({
    data: {
      tenantId: tenant.id,
      name: 'Free Access',
      description: 'Basic community access, public posts, and resources.',
      price: 0,
      interval: Interval.MONTH,
      features: ['Community Feed', 'Public Forums'],
      isDefault: true,
      isPublic: true,
    },
  });

  const basicTier = await prisma.tier.create({
    data: {
      tenantId: tenant.id,
      name: 'Bronze Academy',
      description: 'Access to community feed, live Q&As, and basic course.',
      price: 49,
      interval: Interval.MONTH,
      features: ['Community Feed', 'Monthly Live Q&A', 'Bronze Course Library'],
      isDefault: false,
      isPublic: true,
    },
  });

  const premiumTier = await prisma.tier.create({
    data: {
      tenantId: tenant.id,
      name: 'Gold Elite',
      description: 'Full access to all courses, 1-on-1 coaching chat, and weekly group calls.',
      price: 99,
      interval: Interval.MONTH,
      features: ['Everything in Bronze', 'All Elite Courses', '1:1 Creator Chat Support', 'Weekly Hotseat Call'],
      isDefault: false,
      isPublic: true,
    },
  });

  console.log(`Created Tiers: ${freeTier.name}, ${basicTier.name}, ${premiumTier.name}`);

  // 5. Create Members (paying customers)
  const member1 = await prisma.member.create({
    data: {
      tenantId: tenant.id,
      email: 'john.doe@gmail.com',
      name: 'John Doe',
      phone: '+15550199',
      tierId: premiumTier.id,
      status: 'ACTIVE',
      engagementScore: 85,
      lifetimeValue: 297.0,
      totalSpent: 297.0,
      tags: ['elite', 'high-engagement'],
      stripeCustomerId: 'cus_mock_john123',
    },
  });

  const member2 = await prisma.member.create({
    data: {
      tenantId: tenant.id,
      email: 'jane.smith@yahoo.com',
      name: 'Jane Smith',
      tierId: basicTier.id,
      status: 'ACTIVE',
      engagementScore: 40,
      lifetimeValue: 98.0,
      totalSpent: 98.0,
      tags: ['active'],
      stripeCustomerId: 'cus_mock_jane456',
    },
  });

  const member3 = await prisma.member.create({
    data: {
      tenantId: tenant.id,
      email: 'lisa.miller@outlook.com',
      name: 'Lisa Miller',
      tierId: freeTier.id,
      status: 'CHURNED',
      engagementScore: 5,
      lifetimeValue: 0.0,
      totalSpent: 0.0,
      tags: ['inactive'],
      churnedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
  });

  console.log(`Created Members: ${member1.name}, ${member2.name}, ${member3.name}`);

  // 6. Create Community Feed Posts
  const post1 = await prisma.post.create({
    data: {
      tenantId: tenant.id,
      userId: creator.id,
      title: 'Welcome to the Fitness Academy!',
      content: 'I am thrilled to have you all here. Let’s make this week count. What are your training goals this week?',
      type: PostType.TEXT,
      likes: 12,
      comments: 4,
      isPinned: true,
      isAnnouncement: true,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      tenantId: tenant.id,
      memberId: member1.id,
      content: 'Just smashed a new squat PR! 315 lbs for 5 reps. Feeling stronger than ever thanks to the Gold program!',
      type: PostType.TEXT,
      likes: 8,
      comments: 2,
    },
  });

  console.log(`Created Posts: Pinned announcement, and student success story.`);

  // 7. Create Courses
  const course = await prisma.course.create({
    data: {
      tenantId: tenant.id,
      title: 'Fat Loss & Hypertrophy Essentials',
      description: 'The science-based training guide to building muscle and losing fat.',
      published: true,
    },
  });

  const module1 = await prisma.module.create({
    data: {
      courseId: course.id,
      title: 'Nutrition Principles',
      order: 1,
    },
  });

  const lesson1_1 = await prisma.lesson.create({
    data: {
      moduleId: module1.id,
      title: 'Caloric Balances & Macros',
      content: 'In this lesson we cover calories in vs calories out, and macro breakdowns.',
      videoUrl: 'https://vimeo.com/placeholder1',
      duration: 12,
      order: 1,
    },
  });

  const lesson1_2 = await prisma.lesson.create({
    data: {
      moduleId: module1.id,
      title: 'Designing Your Meal Plan',
      content: 'Learn how to structure your daily meals for sustainable hypertrophy.',
      videoUrl: 'https://vimeo.com/placeholder2',
      duration: 18,
      order: 2,
    },
  });

  console.log(`Created Course: "${course.title}" with 1 module and 2 lessons.`);

  // 8. Create Tasks for Admin Team
  const task1 = await prisma.task.create({
    data: {
      tenantId: tenant.id,
      title: 'Review churn alert for Lisa Miller',
      description: 'Lisa has not logged in for 10 days and recently cancelled subscription.',
      status: TaskStatus.TODO,
      priority: Priority.HIGH,
      createdById: creator.id,
      assignedToId: moderator.id,
      relatedMemberId: member3.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      tenantId: tenant.id,
      title: 'Approve new community content calendar',
      description: 'Draft the post schedules for July 2026.',
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      createdById: creator.id,
      assignedToId: creator.id,
    },
  });

  console.log(`Created Tasks: ${task1.title}, ${task2.title}`);

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
