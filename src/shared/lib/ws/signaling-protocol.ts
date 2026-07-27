export const SIGNALING_PATH = "/ws";

export type EncryptedEnvelope = {
	iv: string;
	ciphertext: string;
};

export type RtcSignal =
	| { kind: "offer"; sdp: string }
	| { kind: "answer"; sdp: string }
	| { kind: "ice-candidate"; candidate: RTCIceCandidateInit };

export type PresencePeer = {
	deviceId: string;
	publicKey: string;
	displayName: string;
};

export type ClientToServerMessage =
	| { type: "hello"; publicKey: string }
	| { type: "signal"; to: string; signal: RtcSignal }
	| { type: "relay-message"; to: string; envelope: EncryptedEnvelope }
	| { type: "relay-ack"; messageId: string };

export type ServerToClientMessage =
	| { type: "welcome"; deviceId: string }
	| { type: "presence"; peers: PresencePeer[] }
	| { type: "signal"; from: string; signal: RtcSignal }
	| {
			type: "relay-message";
			from: string;
			messageId: string;
			envelope: EncryptedEnvelope;
	  }
	| { type: "error"; message: string };
