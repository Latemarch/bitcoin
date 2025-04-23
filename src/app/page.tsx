import Container from '@/components/candleChart/Container';
import OptionPanel from '@/components/OptionPanel';
export default function Home() {
  return (
    <div className="flex flex-col items-center ">
      <Container />
      <OptionPanel />
    </div>
  );
}
