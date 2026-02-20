import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-utils'
import { addPoints } from '@/lib/points'
import { POINTS_PER_TASK } from '@/lib/constants'
import { PointType } from '@prisma/client'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ day: string }> },
) {
  const { error, user } = await requireAuth()
  if (error) return error

  const { day: dayParam } = await params
  const day = parseInt(dayParam, 10)
  if (isNaN(day)) {
    return NextResponse.json({ error: 'Invalid day parameter' }, { status: 400 })
  }

  const task = await prisma.dailyTask.findUnique({ where: { day } })
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  const isDev = process.env.NODE_ENV === 'development'
  if (!isDev && !task.isOpen) {
    return NextResponse.json({ error: '此任務尚未開放' }, { status: 403 })
  }

  if (!isDev && task.isClosed) {
    return NextResponse.json({ error: '此任務已截止' }, { status: 403 })
  }

  const existing = await prisma.taskCompletion.findUnique({
    where: { userId_taskId: { userId: user!.id, taskId: task.id } },
  })
  if (existing && task.taskType !== 'MULTI_QUIZ') {
    return NextResponse.json({ error: 'Task already completed' }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))
  const config = task.taskConfig as Record<string, unknown> | null

  if (task.taskType === 'QUIZ') {
    const correctAnswer = config?.correctAnswer
    if (body.answer == null || body.answer !== correctAnswer) {
      return NextResponse.json({ error: 'Incorrect answer' }, { status: 400 })
    }
  }

  if (task.taskType === 'TEXT_ANSWER') {
    const minLength = (config?.minLength as number) ?? 1
    if (!body.answer || typeof body.answer !== 'string' || body.answer.trim().length < minLength) {
      return NextResponse.json(
        { error: `Answer must be at least ${minLength} characters` },
        { status: 400 },
      )
    }
  }

  if (task.taskType === 'PHOTO_UPLOAD') {
    if (!body.answer || typeof body.answer !== 'string' || !body.answer.startsWith('/api/photos/serve/')) {
      return NextResponse.json({ error: 'Please upload a photo' }, { status: 400 })
    }
  }

  if (task.taskType === 'PHOTO_TEXT') {
    if (!body.photoUrl || typeof body.photoUrl !== 'string' || !body.photoUrl.startsWith('/api/photos/serve/')) {
      return NextResponse.json({ error: 'Please upload a photo' }, { status: 400 })
    }
    const minLength = (config?.minLength as number) ?? 1
    if (!body.text || typeof body.text !== 'string' || body.text.trim().length < minLength) {
      return NextResponse.json(
        { error: `文字介紹至少需要 ${minLength} 個字` },
        { status: 400 },
      )
    }
    body.answer = JSON.stringify({ photoUrl: body.photoUrl, text: body.text.trim() })
  }

  if (task.taskType === 'BOOK_DATE') {
    if (!body.bookName || typeof body.bookName !== 'string' || body.bookName.trim().length === 0) {
      return NextResponse.json({ error: '請輸入書名' }, { status: 400 })
    }
    if (!body.targetDate || typeof body.targetDate !== 'string') {
      return NextResponse.json({ error: '請選擇預計看完日期' }, { status: 400 })
    }
    const dateVal = new Date(body.targetDate)
    if (isNaN(dateVal.getTime())) {
      return NextResponse.json({ error: '日期格式不正確' }, { status: 400 })
    }
    body.answer = JSON.stringify({ bookName: body.bookName.trim(), targetDate: body.targetDate })
  }

  if (task.taskType === 'MULTI_QUIZ') {
    if (existing) {
      return NextResponse.json({ error: 'Task already completed' }, { status: 400 })
    }
    const questions = (config?.questions as Array<{ correctAnswer: number }>) ?? []
    const answers = body.answers as number[] | undefined
    if (!Array.isArray(answers) || answers.length !== questions.length) {
      return NextResponse.json({ error: '請回答所有題目' }, { status: 400 })
    }
    const wrongIndices: number[] = []
    questions.forEach((q, i) => {
      if (answers[i] !== q.correctAnswer) wrongIndices.push(i)
    })
    if (wrongIndices.length > 0) {
      return NextResponse.json(
        { error: `答錯了 ${wrongIndices.length} 題，請重新作答！`, wrongIndices },
        { status: 400 },
      )
    }
    body.answer = JSON.stringify(answers)
  }

  const completion = await prisma.taskCompletion.create({
    data: {
      userId: user!.id,
      taskId: task.id,
      answer: body.answer != null ? String(body.answer) : null,
    },
  })

  const result = await addPoints(
    user!.id,
    POINTS_PER_TASK,
    PointType.TASK_COMPLETION,
    completion.id,
    task.title,
  )

  return NextResponse.json({
    success: true,
    points: POINTS_PER_TASK,
    newTickets: result.newTicketsCount,
  })
}
