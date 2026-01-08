
import React from 'react';
import BrainCircuitDiagram from './components/BrainCircuitDiagram';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col items-center p-4 md:p-8 font-sans">
      <header className="w-full max-w-5xl mb-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-blue-600 mb-4">
          🎯 집중력과 인지력을 깨우는 가속뇌 운동!
        </h1>
        <p className="text-lg md:text-xl text-gray-700 mb-2">
          "눈이 움직일 때, 뇌가 깨어납니다."
        </p>
        <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-4">
          우리의 도약 안구 운동(Saccade) 훈련은 단순한 시선 이동을 넘어, 뇌 신경회로 전체를 활성화하는 강력한 두뇌 자극 프로그램입니다.
        </p>
        <p className="text-sm md:text-base text-gray-600 leading-relaxed">
          🌈 시선이 목표물에 닿을 때마다 뇌 회로가 활성화되는 형태를 색상의 동기화로 볼 수 있습니다.
          <br />
          🎆 전체 주기가 완료되면, 전두엽의 실행능력 보상 회로를 자극하게 됩니다.
        </p>
      </header>

      <main className="w-full max-w-5xl flex flex-col lg:flex-row gap-6">
        <div className="lg:w-2/3 bg-white border border-gray-200 p-4 rounded-xl shadow-lg">
          <BrainCircuitDiagram />
        </div>
        <aside className="lg:w-1/3 bg-white border border-gray-200 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-blue-600 mb-3">뇌 활성화 단계:</h2>
          <p className="text-sm text-gray-600 mb-3">
            이 운동은 눈이 두 지점을 오갈 때마다, 다음과 같은 뇌의 핵심 영역을 단계적으로 작동시킵니다:
          </p>
          <ul className="space-y-2 text-gray-600 text-sm mb-6">
            <li>🧠 <strong className="text-blue-600">전전두피질(PFC):</strong> 집중력과 의사결정을 담당하며, 불필요한 자극을 억제합니다.</li>
            <li>🔍 <strong className="text-blue-600">FEF & PPC:</strong> 시선의 방향을 계획하고 선택합니다.</li>
            <li>🌀 <strong className="text-blue-600">SEF:</strong> 복잡한 시선 순서를 기억하고 실행합니다.</li>
            <li>⚙️ <strong className="text-blue-600">SC & 기저핵(BG):</strong> 눈의 실제 움직임을 정밀하게 조율합니다.</li>
          </ul>
          <p className="text-sm text-gray-700 font-medium mb-4">
            이 훈련은 단순한 시선 움직임을 넘어, 전두엽의 조절력, 주의 집중, 반응 억제, 순서 기억을 동시에 단련합니다.
          </p>
          
          <hr className="border-gray-200 my-6" />

          <h3 className="text-lg font-semibold text-blue-600 mb-3">💡 누구에게 필요할까요?</h3>
          <ul className="list-disc list-inside ml-2 text-sm space-y-1 text-gray-600 mb-6">
            <li>집중이 어려운 청소년과 학생</li>
            <li>기억력과 판단력이 중요한 성인과 직장인</li>
            <li>인지 훈련이 필요한 고령층까지!</li>
          </ul>
        </aside>
      </main>
    </div>
  );
};

export default App;
