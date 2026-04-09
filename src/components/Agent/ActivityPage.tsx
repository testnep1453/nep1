import { Student } from '../../types/student';

export const ActivityPage = ({ student }: { student: Student }) => {
  void student;
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-4 animate-fade-in">
      <div className="text-5xl opacity-30">📅</div>
      <p className="text-gray-600 text-sm uppercase tracking-widest font-mono">Yakında</p>
    </div>
  );
};
