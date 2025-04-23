const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export async function cleanDatabase() {
  try {
    console.log('BitcoinTrade 테이블의 모든 데이터를 삭제합니다...');

    // 모든 데이터 삭제
    const deleteResult = await prisma.bitcoinTrade.deleteMany({});
    console.log(`삭제된 레코드 수: ${deleteResult.count}`);

    console.log('데이터베이스 정리 완료!');
  } catch (error) {
    console.error('데이터베이스 정리 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// cleanDatabase()
//   .then(() => {
//     console.log('스크립트 실행 완료');
//     process.exit(0);
//   })
//   .catch((err) => {
//     console.error('스크립트 실행 중 오류 발생:', err);
//     process.exit(1);
//   });
