import { PrismaClient, TaskType, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

const tasks: Prisma.DailyTaskCreateInput[] = [
  {
    day: 1,
    date: new Date('2025-02-14'),
    title: '🎉 情人節簽到',
    description: '活動開始啦！點擊簽到按鈕完成今日任務，開啟新年闖關之旅！',
    taskType: TaskType.CHECK_IN,
    taskConfig: Prisma.JsonNull,
    points: 2,
  },
  {
    day: 2,
    date: new Date('2025-02-15'),
    title: '🧧 新年紅包問答',
    description: '回答新年相關的趣味問題，看看你對年節習俗了解多少！',
    taskType: TaskType.QUIZ,
    taskConfig: {
      question: '春節傳統上要貼春聯，春聯通常是什麼顏色的？',
      options: ['紅色', '藍色', '綠色', '黃色'],
      correctAnswer: 0,
    },
    points: 2,
  },
  {
    day: 3,
    date: new Date('2025-02-16'),
    title: '✍️ 新年願望',
    description: '寫下你的新年願望或對團隊的祝福語！',
    taskType: TaskType.TEXT_ANSWER,
    taskConfig: {
      minLength: 10,
      placeholder: '寫下你的新年願望...',
    },
    points: 2,
  },
  {
    day: 4,
    date: new Date('2025-02-17'),
    title: '🏮 元宵猜燈謎',
    description: '猜猜這個燈謎的答案吧！',
    taskType: TaskType.QUIZ,
    taskConfig: {
      question: '燈謎：「一口咬掉牛尾巴」打一字',
      options: ['告', '牢', '午', '半'],
      correctAnswer: 0,
    },
    points: 2,
  },
  {
    day: 5,
    date: new Date('2025-02-18'),
    title: '📸 分享美食照',
    description: '今天的任務是簽到！別忘了也可以上傳照片牆賺額外積分喔～',
    taskType: TaskType.CHECK_IN,
    taskConfig: Prisma.JsonNull,
    points: 2,
  },
  {
    day: 6,
    date: new Date('2025-02-19'),
    title: '🎯 新年知識王',
    description: '挑戰新年相關知識問答！',
    taskType: TaskType.QUIZ,
    taskConfig: {
      question: '農曆新年的「守歲」是指什麼？',
      options: [
        '除夕夜不睡覺等待新年',
        '過年期間吃素',
        '大掃除',
        '拜年',
      ],
      correctAnswer: 0,
    },
    points: 2,
  },
  {
    day: 7,
    date: new Date('2025-02-20'),
    title: '💬 團隊感謝',
    description: '寫下你想感謝的一位同事，以及感謝的原因！',
    taskType: TaskType.TEXT_ANSWER,
    taskConfig: {
      minLength: 15,
      placeholder: '我想感謝...',
    },
    points: 2,
  },
  {
    day: 8,
    date: new Date('2025-02-21'),
    title: '🎮 幸運簽到',
    description: '倒數第二天！簽到收集最後的積分，為抽獎做準備！',
    taskType: TaskType.CHECK_IN,
    taskConfig: Prisma.JsonNull,
    points: 2,
  },
  {
    day: 9,
    date: new Date('2025-02-22'),
    title: '🎊 活動最終日',
    description: '最後一天！完成簽到，期待抽獎結果吧！',
    taskType: TaskType.CHECK_IN,
    taskConfig: Prisma.JsonNull,
    points: 2,
  },
]

async function main() {
  console.log('Seeding database...')

  for (const task of tasks) {
    await prisma.dailyTask.upsert({
      where: { day: task.day as number },
      update: {
        date: task.date,
        title: task.title,
        description: task.description,
        taskType: task.taskType,
        taskConfig: task.taskConfig,
        points: task.points,
      },
      create: task,
    })
    console.log(`  Created task day ${task.day}: ${task.title}`)
  }

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
