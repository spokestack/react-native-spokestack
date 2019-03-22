package com.pylon.RNSpokestack;

import android.content.Context;
import android.util.Log;

/* Our very own exception handler for all threads with us as the parent process.
 * https://github.com/googleapis/google-cloud-java/issues/4727 necessitates this.
 * Hence we silently swallow the specific exception, and let the default exception handler
 * do its thing otherwise.
 */
public class ExceptionHandler implements Thread.UncaughtExceptionHandler {

  private Context context;
  private Thread.UncaughtExceptionHandler rootHandler;

  public GlobalExceptionHandler(Context context) {
    this.context = context;
    this.rootHandler = Thread.getDefaultUncaughtExceptionHandler();
    Thread.setDefaultUncaughtExceptionHandler(this);
  }

  /* The specific exception to ignore stems from grpc-okhttp-1, which is present in google-cloud-speech 0.84.0-beta.
   * https://github.com/grpc/grpc-java/blob/master/okhttp/src/main/java/io/grpc/okhttp/OkHttpClientTransport.java#L933
   */
  @Override
  public void uncaughtException(final Thread thread, final Throwable ex) {
    if (this.rootHandler != null && ex instanceof java.util.concurrent.RejectedExecutionException) {
      Log.i("react-native-spokestack","ignoring known exception: " + ex.toString());
    } else if (this.rootHandler != null) {
      this.rootHandler.uncaughtException(thread, ex);
    } else {
      Log.e("react-native-spokestack","no root handlerfor uncaught exception, killing process and exiting.");
      android.os.Process.killProcess(android.os.Process.myPid());
      System.exit(0);
    }
  }
}
