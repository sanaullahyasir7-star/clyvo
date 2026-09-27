/** Owns microphone acquisition, including permissions that resolve after cancellation. */
export class MicrophoneLease {
  private version = 0;
  private stream: MediaStream | null = null;
  stop() {
    this.version++;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }
  async acquire(capture: () => Promise<MediaStream>) {
    this.stop();
    const version = this.version;
    const stream = await capture();
    if (version !== this.version) {
      stream.getTracks().forEach((track) => track.stop());
      return null;
    }
    this.stream = stream;
    return stream;
  }
}
