const mongoose = require("mongoose");

const AuthkeysettingSchema = new mongoose.Schema({
  google: {
    enabled: { type: Boolean, default: true },
    apiKey: { type: String, default: ""  },
    apiSecretKey: { type: String, default: ""  },
    apiRedirectUrl: { type: String, default: ""  }
  },
  github: {
    enabled: { type: Boolean, default: true },
    apiKey: { type: String, default: ""  },
    apiSecretKey: { type: String, default: ""  },
    apiRedirectUrl: { type: String, default: ""  }
  }
}, { timestamps: true });

module.exports = mongoose.model("Authkeysetting", AuthkeysettingSchema);
