const auto = require('@pulumi/pulumi/automation');
const aws = require('@pulumi/aws');
const process = require('process');

const args = process.argv.slice(2);
let destroy = false;
if (args.length > 0 && args[0]) {
  destroy = args[0] === 'destroy';
}

const run = async () => {
  // This is our pulumi program in "inline function" form
  const pulumiProgram = async () => {
    // Create a bucket and expose a website index document
    const siteBucket = new aws.s3.Bucket('s3-website-bucket', {
      website: {
        indexDocument: 'index.html',
      },
    });
    const indexContent = `<html><head><title>Hello S3</title></head><body><p>Hello, <b> Pulumi..!</b></p></body></html>`;

    //   Write our index.html into the site bucket
    let object = new aws.s3.BucketObject('index', {
      bucket: siteBucket,
      content: indexContent,
      contentType: 'text/html; charset=utf-8',
      key: 'index.html',
    });

    //   Create an S3 Bucket Policy to allow public read of all objects in bucket
    function publicReadPolicyForBucket(bucketName) {
      return {
        version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucketName}/*`], // Policy refers to bucket name implicitly
          },
        ],
      };
    }
  };
};
