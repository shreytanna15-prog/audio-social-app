#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface SuperpoweredPolishBridge : NSObject

+ (BOOL)initializeWithLicenseKey:(NSString *)licenseKey error:(NSError *_Nullable *_Nullable)error;

+ (NSString *_Nullable)processFileAtPath:(NSString *)inputPath
                          outputWavPath:(NSString *)outputWavPath
                                 preset:(NSString *)preset
                                  error:(NSError *_Nullable *_Nullable)error;

@end

NS_ASSUME_NONNULL_END
