import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    videoFile: {
      url: {
        type: String, // cloudinary URL or local path
        required: true,
      },
      id: {
        type: String, // cloudinary public ID or local path
        required: true,
        select: false,
      },
    },
    thumbnail: {
      url: {
        type: String, // cloudinary URL or local path
        required: true,
      },
      id: {
        type: String, // cloudinary public ID or local path
        required: true,
        select: false,
      },
    },
    duration: {
      type: Number, // duration in seconds from cloudinary or local file
      required: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    isPublic: {
      type: Boolean,
      default: true, // public by default
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

videoSchema.plugin(mongooseAggregatePaginate);

const Video = mongoose.model("Video", videoSchema);
export default Video;
