const DATA_CHANNEL_LABEL = "peerchat";

/**
 * STUN-only ICE config. Without a TURN server, peers behind a symmetric NAT
 * or restrictive firewall (common on corporate networks/some carriers) can
 * fail to establish a direct connection. Add a TURN server here (e.g. a
 * self-hosted coturn) for reliable connectivity in those environments.
 */
const ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

export type PeerConnectionOptions = {
	peerId: string;
	isInitiator: boolean;
	onIceCandidate: (candidate: RTCIceCandidateInit) => void;
	onDataChannelOpen: () => void;
	onDataChannelMessage: (data: string) => void;
	onClose: () => void;
};

export class PeerConnection {
	readonly peerId: string;
	private readonly connection: RTCPeerConnection;
	private readonly options: PeerConnectionOptions;
	private dataChannel: RTCDataChannel | null = null;

	constructor(options: PeerConnectionOptions) {
		this.peerId = options.peerId;
		this.options = options;
		this.connection = new RTCPeerConnection({ iceServers: ICE_SERVERS });

		this.connection.addEventListener("icecandidate", (event) => {
			if (event.candidate) {
				options.onIceCandidate(event.candidate.toJSON());
			}
		});

		this.connection.addEventListener("connectionstatechange", () => {
			const state = this.connection.connectionState;
			if (
				state === "closed" ||
				state === "failed" ||
				state === "disconnected"
			) {
				options.onClose();
			}
		});

		if (options.isInitiator) {
			this.setupDataChannel(
				this.connection.createDataChannel(DATA_CHANNEL_LABEL),
			);
		} else {
			this.connection.addEventListener("datachannel", (event) => {
				this.setupDataChannel(event.channel);
			});
		}
	}

	private setupDataChannel(channel: RTCDataChannel): void {
		this.dataChannel = channel;
		channel.addEventListener("open", () => this.options.onDataChannelOpen());
		channel.addEventListener("message", (event) =>
			this.options.onDataChannelMessage(event.data),
		);
	}

	async createOffer(): Promise<RTCSessionDescriptionInit> {
		const offer = await this.connection.createOffer();
		await this.connection.setLocalDescription(offer);
		return offer;
	}

	async createAnswer(
		offer: RTCSessionDescriptionInit,
	): Promise<RTCSessionDescriptionInit> {
		await this.connection.setRemoteDescription(offer);
		const answer = await this.connection.createAnswer();
		await this.connection.setLocalDescription(answer);
		return answer;
	}

	async acceptAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
		await this.connection.setRemoteDescription(answer);
	}

	async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
		await this.connection.addIceCandidate(candidate);
	}

	get hasRemoteDescription(): boolean {
		return this.connection.remoteDescription !== null;
	}

	get isDataChannelOpen(): boolean {
		return this.dataChannel?.readyState === "open";
	}

	send(data: string): boolean {
		if (this.isDataChannelOpen) {
			this.dataChannel?.send(data);
			return true;
		}
		return false;
	}

	close(): void {
		this.dataChannel?.close();
		this.connection.close();
	}
}
