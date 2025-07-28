import mongoose from "mongoose";

const SubscriptionSchema = new mongoose.Schema(
  {
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subscriber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

SubscriptionSchema.pre("save", function (next) {
  if (this.channel.toString() === this.subscriber.toString()) {
    return next(new Error("User cannot subscribe to themselves."));
  }
  next();
});

const Subscription = mongoose.model("Subscription", SubscriptionSchema);

export default Subscription;
