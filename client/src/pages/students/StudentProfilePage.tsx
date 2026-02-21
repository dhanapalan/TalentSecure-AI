import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();

  const { data: student, isLoading } = useQuery({
    queryKey: ["student", id],
    queryFn: async () => {
      const { data } = await api.get(`/students/${id}`);
      return data.data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-12 text-gray-400">Loading profile…</div>;
  }

  if (!student) {
    return <div className="text-center py-12 text-red-500">Student not found</div>;
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">
        {student.firstName} {student.lastName}
      </h1>
      <p className="text-gray-500">{student.email}</p>

      <div className="card mt-6 grid grid-cols-2 gap-6">
        <div>
          <p className="text-sm text-gray-500">University</p>
          <p className="font-medium">{student.university}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Degree</p>
          <p className="font-medium">{student.degree}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Major</p>
          <p className="font-medium">{student.major}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">CGPA</p>
          <p className="text-xl font-bold text-primary-600">{student.cgpa?.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Graduation Year</p>
          <p className="font-medium">{student.graduationYear}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Match Score</p>
          <p className="font-medium">
            {student.matchScore != null ? `${(student.matchScore * 100).toFixed(0)}%` : "Not scored"}
          </p>
        </div>
      </div>

      {/* Skills */}
      <div className="card mt-6">
        <h3 className="font-semibold text-gray-900">Skills</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {student.skills?.map((skill: string) => (
            <span key={skill} className="badge-info">{skill}</span>
          ))}
          {(!student.skills || student.skills.length === 0) && (
            <span className="text-sm text-gray-400">No skills listed</span>
          )}
        </div>
      </div>
    </div>
  );
}
