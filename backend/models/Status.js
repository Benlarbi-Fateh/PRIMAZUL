const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    type: { 
      type: String, 
      enum: ["text", "image", "video"], 
      default: "text" 
    },
    content: { 
      type: String, 
      required: function() {
        return this.type === "text";
      }
    },
    mediaUrl: {
      type: String,
      required: function() {
        return this.type === "image" || this.type === "video";
      }
    },
    videoDuration: {
      type: Number,
      required: function() {
        return this.type === "video";
      }
    },
    thumbnailUrl: {
      type: String,
      required: function() {
        return this.type === "video";
      }
    },
    fileSize: {
      type: Number,
      required: function() {
        return this.type === "image" || this.type === "video";
      }
    },
    mimeType: {
      type: String,
      default: ""
    },
    views: [{
      userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
      },
      viewedAt: { 
        type: Date, 
        default: Date.now 
      },
      reaction: { 
        type: String, 
        enum: ["like", "love", "haha", "wow", "sad", "angry", "fire", "clap", null],
        default: null
      },
      replyMessage: {
        type: String,
        default: null
      }
    }],
    reactionsSummary: {
      like: { type: Number, default: 0 },
      love: { type: Number, default: 0 },
      haha: { type: Number, default: 0 },
      wow: { type: Number, default: 0 },
      sad: { type: Number, default: 0 },
      angry: { type: Number, default: 0 },
      fire: { type: Number, default: 0 },
      clap: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    repliesCount: { 
      type: Number, 
      default: 0 
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  },
  {
    timestamps: true
  }
);

statusSchema.index({ userId: 1, createdAt: -1 });
statusSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
statusSchema.index({ "views.userId": 1 });

statusSchema.methods.addOrUpdateReaction = async function(userId, reactionType) {
  const userView = this.views.find(
    view => view.userId && view.userId.toString() === userId.toString()
  );
  
  if (!userView) {
    this.views.push({
      userId,
      viewedAt: new Date(),
      reaction: reactionType
    });
    
    if (reactionType && this.reactionsSummary[reactionType] !== undefined) {
      this.reactionsSummary[reactionType]++;
      this.reactionsSummary.total++;
    }
  } else {
    const oldReaction = userView.reaction;
    
    if (oldReaction && this.reactionsSummary[oldReaction] > 0) {
      this.reactionsSummary[oldReaction]--;
      this.reactionsSummary.total--;
    }
    
    userView.reaction = reactionType;
    
    if (reactionType && this.reactionsSummary[reactionType] !== undefined) {
      this.reactionsSummary[reactionType]++;
      this.reactionsSummary.total++;
    }
  }
  
  return this.save();
};

statusSchema.methods.removeReaction = async function(userId) {
  const userView = this.views.find(
    view => view.userId && view.userId.toString() === userId.toString()
  );
  
  if (userView && userView.reaction) {
    const oldReaction = userView.reaction;
    
    if (this.reactionsSummary[oldReaction] > 0) {
      this.reactionsSummary[oldReaction]--;
      this.reactionsSummary.total--;
    }
    
    userView.reaction = null;
    
    return this.save();
  }
  
  return this;
};

statusSchema.methods.addReply = async function(userId, message) {
  let userView = this.views.find(
    view => view.userId && view.userId.toString() === userId.toString()
  );
  
  if (!userView) {
    this.views.push({
      userId,
      viewedAt: new Date(),
      reaction: null,
      replyMessage: message
    });
  } else {
    userView.replyMessage = message;
  }
  
  this.repliesCount = (this.repliesCount || 0) + 1;
  
  return this.save();
};

statusSchema.methods.getReactions = function() {
  return this.views
    .filter(view => view.reaction !== null && view.reaction !== undefined)
    .map(view => ({
      userId: view.userId,
      reaction: view.reaction,
      viewedAt: view.viewedAt
    }));
};

statusSchema.methods.getReplies = function() {
  return this.views
    .filter(view => view.replyMessage !== null && view.replyMessage !== undefined)
    .map(view => ({
      userId: view.userId,
      message: view.replyMessage,
      viewedAt: view.viewedAt
    }));
};

module.exports = mongoose.model("Status", statusSchema);