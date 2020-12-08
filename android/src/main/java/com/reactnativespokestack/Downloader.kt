package com.reactnativespokestack

import android.accounts.NetworkErrorException
import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import android.util.Log
import java.io.File
import java.io.FileOutputStream
import java.net.URL

class Downloader(private val context: Context, private val allowCellular: Boolean, private val refreshModels: Boolean) {
  private val logTag = "Spokestack"

  private fun isNetworkAvailable(): Boolean {
    var result = false
    val connectivityManager =
      context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      val networkCapabilities = connectivityManager.activeNetwork ?: return false
      val actNw =
        connectivityManager.getNetworkCapabilities(networkCapabilities) ?: return false
      result = when {
        actNw.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> true
        actNw.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> true
        // Do not download over cellular by default
        actNw.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> allowCellular
        else -> false
      }
    } else {
      connectivityManager.activeNetworkInfo?.run {
        result = when (type) {
          ConnectivityManager.TYPE_WIFI -> true
          ConnectivityManager.TYPE_ETHERNET -> true
          ConnectivityManager.TYPE_MOBILE -> allowCellular
          else -> false
        }
      }
    }
    return result
  }

  fun downloadModel(filename: String, url: String): String {
    if (!isNetworkAvailable()) {
      var message = "Downloading Spokestack model files requires a network connection."
      if (!allowCellular) {
        message += " If you'd like to enable cellular downloads, set allowCellular to true in your Spokestack config."
      }
      throw NetworkErrorException(message)
    }
    val file = File(context.cacheDir, filename)
    if (!refreshModels && file.exists() && file.canRead() && file.length() > 0) {
      Log.d(logTag, "Returning existing file at ${file.canonicalPath}")
      return file.canonicalPath
    }
    Log.d(logTag, "Downloading model file from $url.")
    val cn = URL(url).openConnection()
    cn.connect()
    val stream = cn.getInputStream()
    val out = FileOutputStream(file)
    val buf = ByteArray(16384)
    do {
      val read = stream.read(buf)
      if (read <= 0) break
      out.write(buf, 0, read)
    } while (true)
    stream.close()
    out.close()
    return file.canonicalPath
  }
}
