import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISurveyPoint {
  pointId: number;
  x: number;
  y: number;
  z: number;
}

export interface ISurveyMetrics {
  totalCutVolume: number;
  totalFillVolume: number;
  netBalance: number;
  avgGroundHeight: number;
}

export interface ISurvey extends Document {
  zone: string;
  area: string;
  points: ISurveyPoint[];
  targetZ: number;
  gridArea: number;
  metrics: ISurveyMetrics;
  createdAt: Date;
}

const SurveyPointSchema = new Schema<ISurveyPoint>({
  pointId: { type: Number, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  z: { type: Number, required: true },
}, { _id: false });

const SurveyMetricsSchema = new Schema<ISurveyMetrics>({
  totalCutVolume: { type: Number, required: true },
  totalFillVolume: { type: Number, required: true },
  netBalance: { type: Number, required: true },
  avgGroundHeight: { type: Number, required: true },
}, { _id: false });

const SurveySchema = new Schema<ISurvey>({
  zone: { type: String, required: true, index: true },
  area: { type: String, required: true, index: true },
  points: { type: [SurveyPointSchema], required: true },
  targetZ: { type: Number, required: true },
  gridArea: { type: Number, required: true },
  metrics: { type: SurveyMetricsSchema, required: true },
  createdAt: { type: Date, default: Date.now, index: true },
});

const Survey: Model<ISurvey> = mongoose.models.Survey || mongoose.model<ISurvey>('Survey', SurveySchema);

export default Survey;
