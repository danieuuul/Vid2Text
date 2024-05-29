import fs from 'node:fs'
import path from 'node:path'

import wav from 'node-wav'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'

export const convertToWav = (inputFilePath) =>
  new Promise((resolve, reject) => {
    const originalExtension = path.extname(inputFilePath)

    const outputFilePath = inputFilePath.replace(originalExtension, '.wav')

    console.log('Convertendo o vídeo...')

    ffmpeg.setFfmpegPath(ffmpegStatic)
    ffmpeg()
      .input(inputFilePath)
      .audioFrequency(16000)
      .audioChannels(1)
      .format('wav')
      .on('end', () => {
        const file = fs.readFileSync(outputFilePath)
        const fileDecoded = wav.decode(file)

        const audioData = fileDecoded.channelData[0]
        const floatArray = new Float32Array(audioData)

        console.log('Vídeo convertido com sucesso!')

        resolve(floatArray)
        fs.unlinkSync(outputFilePath)
      })
      .on('error', (error) => {
        console.log('Erro ao converter o vídeo', error)
        reject(error)
      })
      .save(outputFilePath)
  })
