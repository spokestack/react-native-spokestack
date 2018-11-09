#if !defined(GPB_GRPC_FORWARD_DECLARE_MESSAGE_PROTO) || !GPB_GRPC_FORWARD_DECLARE_MESSAGE_PROTO
#import <googleapis/CloudSpeech.pbobjc.h>
#endif

#if !defined(GPB_GRPC_PROTOCOL_ONLY) || !GPB_GRPC_PROTOCOL_ONLY
#import <ProtoRPC/ProtoService.h>
#import <ProtoRPC/ProtoRPC.h>
#import <RxLibrary/GRXWriteable.h>
#import <RxLibrary/GRXWriter.h>
#endif

@class LongRunningRecognizeRequest;
@class Operation;
@class RecognizeRequest;
@class RecognizeResponse;
@class StreamingRecognizeRequest;
@class StreamingRecognizeResponse;

#if !defined(GPB_GRPC_FORWARD_DECLARE_MESSAGE_PROTO) || !GPB_GRPC_FORWARD_DECLARE_MESSAGE_PROTO
  #import <googleapis/Annotations.pbobjc.h>
  #import <googleapis/Operations.pbobjc.h>
#if defined(GPB_USE_PROTOBUF_FRAMEWORK_IMPORTS) && GPB_USE_PROTOBUF_FRAMEWORK_IMPORTS
  #import <Protobuf/Any.pbobjc.h>
#else
  #import "google/protobuf/Any.pbobjc.h"
#endif
#if defined(GPB_USE_PROTOBUF_FRAMEWORK_IMPORTS) && GPB_USE_PROTOBUF_FRAMEWORK_IMPORTS
  #import <Protobuf/Duration.pbobjc.h>
#else
  #import "google/protobuf/Duration.pbobjc.h"
#endif
#if defined(GPB_USE_PROTOBUF_FRAMEWORK_IMPORTS) && GPB_USE_PROTOBUF_FRAMEWORK_IMPORTS
  #import <Protobuf/Timestamp.pbobjc.h>
#else
  #import "google/protobuf/Timestamp.pbobjc.h"
#endif
  #import <googleapis/Status.pbobjc.h>
#endif

@class GRPCProtoCall;


NS_ASSUME_NONNULL_BEGIN

@protocol Speech <NSObject>

#pragma mark Recognize(RecognizeRequest) returns (RecognizeResponse)

/**
 * Performs synchronous speech recognition: receive results after all audio
 * has been sent and processed.
 */
- (void)recognizeWithRequest:(RecognizeRequest *)request handler:(void(^)(RecognizeResponse *_Nullable response, NSError *_Nullable error))handler;

/**
 * Performs synchronous speech recognition: receive results after all audio
 * has been sent and processed.
 */
- (GRPCProtoCall *)RPCToRecognizeWithRequest:(RecognizeRequest *)request handler:(void(^)(RecognizeResponse *_Nullable response, NSError *_Nullable error))handler;


#pragma mark LongRunningRecognize(LongRunningRecognizeRequest) returns (Operation)

/**
 * Performs asynchronous speech recognition: receive results via the
 * google.longrunning.Operations interface. Returns either an
 * `Operation.error` or an `Operation.response` which contains
 * a `LongRunningRecognizeResponse` message.
 */
- (void)longRunningRecognizeWithRequest:(LongRunningRecognizeRequest *)request handler:(void(^)(Operation *_Nullable response, NSError *_Nullable error))handler;

/**
 * Performs asynchronous speech recognition: receive results via the
 * google.longrunning.Operations interface. Returns either an
 * `Operation.error` or an `Operation.response` which contains
 * a `LongRunningRecognizeResponse` message.
 */
- (GRPCProtoCall *)RPCToLongRunningRecognizeWithRequest:(LongRunningRecognizeRequest *)request handler:(void(^)(Operation *_Nullable response, NSError *_Nullable error))handler;


#pragma mark StreamingRecognize(stream StreamingRecognizeRequest) returns (stream StreamingRecognizeResponse)

/**
 * Performs bidirectional streaming speech recognition: receive results while
 * sending audio. This method is only available via the gRPC API (not REST).
 */
- (void)streamingRecognizeWithRequestsWriter:(GRXWriter *)requestWriter eventHandler:(void(^)(BOOL done, StreamingRecognizeResponse *_Nullable response, NSError *_Nullable error))eventHandler;

/**
 * Performs bidirectional streaming speech recognition: receive results while
 * sending audio. This method is only available via the gRPC API (not REST).
 */
- (GRPCProtoCall *)RPCToStreamingRecognizeWithRequestsWriter:(GRXWriter *)requestWriter eventHandler:(void(^)(BOOL done, StreamingRecognizeResponse *_Nullable response, NSError *_Nullable error))eventHandler;


@end


#if !defined(GPB_GRPC_PROTOCOL_ONLY) || !GPB_GRPC_PROTOCOL_ONLY
/**
 * Basic service implementation, over gRPC, that only does
 * marshalling and parsing.
 */
@interface Speech : GRPCProtoService<Speech>
- (instancetype)initWithHost:(NSString *)host NS_DESIGNATED_INITIALIZER;
+ (instancetype)serviceWithHost:(NSString *)host;
@end
#endif

NS_ASSUME_NONNULL_END

