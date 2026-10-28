import { NextResponse } from "next/server";
import { initialSurveys, initialTrainings, persistDataset } from "@/lib/mockData";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trainingIdParam = searchParams.get("trainingId");

    let list = initialSurveys;
    if (trainingIdParam) {
      const tid = parseInt(trainingIdParam);
      list = list.filter((s) => Number(s.trainingId) === tid);
    }

    const populated = list
      .map((s) => ({
        ...s,
        training: initialTrainings.find((t) => Number(t.id) === Number(s.trainingId)),
      }))
      .sort(
        (a, b) =>
          new Date(b.submittedAt || b.createdAt || 0).getTime() -
          new Date(a.submittedAt || a.createdAt || 0).getTime()
      );

    const count = populated.length;
    const summary = {
      totalResponses: count,
      avgInstructor:
        count > 0
          ? Number(
              (
                populated.reduce((acc, s) => acc + (Number(s.ratingInstructor) || 5), 0) / count
              ).toFixed(2)
            )
          : 5.0,
      avgContent:
        count > 0
          ? Number(
              (
                populated.reduce((acc, s) => acc + (Number(s.ratingContent) || 5), 0) / count
              ).toFixed(2)
            )
          : 5.0,
      avgFacilities:
        count > 0
          ? Number(
              (
                populated.reduce((acc, s) => acc + (Number(s.ratingFacilities) || 5), 0) / count
              ).toFixed(2)
            )
          : 5.0,
      avgNps:
        count > 0
          ? Number(
              (
                populated.reduce((acc, s) => acc + (Number(s.recommendationScore) || 10), 0) / count
              ).toFixed(2)
            )
          : 10.0,
    };

    return NextResponse.json({ success: true, data: populated, summary });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      trainingId,
      participantId,
      participantName,
      company,
      cargo,
      ratingInstructor = 5,
      ratingContent = 5,
      ratingFacilities = 5,
      recommendationScore = 10,
      feedback,
      mostLiked,
      suggestions,
      wantsFutureCertifications,
      hasActiveProjects,
      customAnswers = {},
    } = body;

    if (!trainingId) {
      return NextResponse.json(
        { success: false, error: "ID de capacitación requerido" },
        { status: 400 }
      );
    }

    const maxId = initialSurveys.reduce((m, s) => Math.max(m, Number(s.id) || 0), 0);
    const now = new Date().toISOString();

    const newSurvey = {
      id: maxId + 1,
      trainingId: Number(trainingId),
      participantId: participantId ? Number(participantId) : null,
      participantName: participantName || "Participante Sala OnProtec",
      company: company || null,
      cargo: cargo || null,
      ratingInstructor: Number(customAnswers.ratingInstructor ?? ratingInstructor) || 5,
      ratingContent: Number(customAnswers.ratingContent ?? ratingContent) || 5,
      ratingFacilities: Number(customAnswers.ratingFacilities ?? ratingFacilities) || 5,
      recommendationScore: Number(customAnswers.recommendationScore ?? recommendationScore) || 10,
      feedback: feedback || customAnswers.suggestions || null,
      mostLiked: mostLiked || customAnswers.mostLiked || null,
      suggestions: suggestions || customAnswers.suggestions || null,
      wantsFutureCertifications:
        wantsFutureCertifications || customAnswers.wantsFutureCertifications || null,
      hasActiveProjects: hasActiveProjects || customAnswers.hasActiveProjects || null,
      customAnswers,
      submittedAt: now,
      createdAt: now,
    };

    initialSurveys.push(newSurvey);
    await persistDataset();

    return NextResponse.json({ success: true, data: newSurvey }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
