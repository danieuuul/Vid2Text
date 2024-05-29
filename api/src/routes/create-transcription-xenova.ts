import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { pipeline } from '@xenova/transformers'
import { convertToWav } from '../utils/convertToWav'

export async function createTranscriptionRoute(app: FastifyInstance) {
  app.post('/videos/:videoId/transcription', async (req) => {
    const paramsSchema = z.object({
      videoId: z.string().uuid(),
    })

    const { videoId } = paramsSchema.parse(req.params)

    const bodySchema = z.object({
      prompt: z.string(),
    })

    const { prompt } = bodySchema.parse(req.body)

    const video = await prisma.video.findUniqueOrThrow({
      where: {
        id: videoId,
      },
    })

    const audioConverted = (await convertToWav(video.path)) as Float32Array

    const transcriber = await pipeline(
      'automatic-speech-recognition',
      'Xenova/whisper-small'
    )

    const data = await transcriber(audioConverted, {
      language: 'english',
      chunk_length_s: 30,
      stride_length_s: 5,
      task: 'transcribe',
    })

    const transcription = Array.isArray(data) ? data[0].text : data.text

    await prisma.video.update({
      where: {
        id: videoId,
      },
      data: {
        transcription,
      },
    })

    return {
      transcription,
    }
  })
}
