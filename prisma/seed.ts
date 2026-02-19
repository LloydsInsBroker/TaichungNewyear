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
    title: '☀️ 與太陽公公合照',
    description: '大年初一，上傳一張你與太陽公公的合照！象徵新的一年業績蒸蒸日上！',
    taskType: TaskType.PHOTO_UPLOAD,
    taskConfig: Prisma.JsonNull,
    points: 2,
  },
  {
    day: 5,
    date: new Date('2025-02-18'),
    title: '初二回娘家',
    description: '上傳一道媽媽的拿手好菜，並且文字介紹為什麼喜歡吃!',
    taskType: TaskType.PHOTO_TEXT,
    taskConfig: {
      minLength: 10,
      placeholder: '分享為什麼喜歡這道菜...',
    },
    points: 2,
  },
  {
    day: 6,
    date: new Date('2025-02-19'),
    title: '📰 全球財經新聞大挑戰',
    description: '挑戰 10 題 2025-2026 全球財經時事題，全部答對才能過關！答錯可以重新作答喔～',
    taskType: TaskType.MULTI_QUIZ,
    taskConfig: {
      questions: [
        {
          question: '2026年2月，美國道瓊工業指數首次突破哪個歷史性里程碑？',
          options: ['40,000 點', '45,000 點', '50,000 點', '55,000 點'],
          correctAnswer: 2,
        },
        {
          question: '比特幣在2025年10月創下歷史新高，大約突破多少美元？',
          options: ['10 萬美元', '12.6 萬美元', '15 萬美元', '20 萬美元'],
          correctAnswer: 1,
        },
        {
          question: '2026年初，投資人因擔憂美元貶值而大量買入黃金，市場將此現象稱為？',
          options: ['套利交易（Carry Trade）', '貶值交易（Debasement Trade）', '量化寬鬆交易（QE Trade）', '動能交易（Momentum Trade）'],
          correctAnswer: 1,
        },
        {
          question: '2026年1月，川普提名誰接替鮑威爾（Jerome Powell）擔任下一任聯準會主席？',
          options: ['乔恩·泰勒（John Taylor）', '凱文·乔什（Kevin Warsh）', '拉里·薩默斯（Larry Summers）', '珍妮特·葉倫（Janet Yellen）'],
          correctAnswer: 1,
        },
        {
          question: '2025年美國通過首部加密貨幣重要法案「GENIUS Act」，該法案主要規範的對象是？',
          options: ['比特幣挖礦', 'NFT 交易', '穩定幣（Stablecoin）', '去中心化交易所'],
          correctAnswer: 2,
        },
        {
          question: '2025年3月，川普簽署行政命令，宣布建立美國國家級的什麼儲備？',
          options: ['黃金戰略儲備', '加密貨幣儲備', '稀土戰略儲備', '石油戰略儲備'],
          correctAnswer: 1,
        },
        {
          question: '2026年1月，美國在哪個國家執行了一項震驚全球的行動，逮捕了該國現任總統？',
          options: ['古巴', '委內瑞拉', '尼加拉瓜', '玻利維亞'],
          correctAnswer: 1,
        },
        {
          question: '2026年初，日本國會大選中，自民黨（LDP）在誰的帶領下取得史上最大壓倒性勝利？',
          options: ['岸田文雄', '石破茂', '高市早苗', '河野太郎'],
          correctAnswer: 2,
        },
        {
          question: '2025-2026年金融界熱門趨勢「RWA 代幣化」，RWA 是什麼的縮寫？',
          options: ['Real World Assets（真實世界資產）', 'Risk Weighted Assets（風險加權資產）', 'Regulated Web Applications（受監管網路應用）', 'Remote Work Automation（遠端工作自動化）'],
          correctAnswer: 0,
        },
        {
          question: '2026年2月6日道瓊首次突破50,000點，當日漲幅最大的個股之一是哪家公司？',
          options: ['蘋果（Apple）', '微軟（Microsoft）', '輝達（NVIDIA）', '亞馬遜（Amazon）'],
          correctAnswer: 2,
        },
      ],
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
