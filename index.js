const auto = require('@pulumi/pulumi/automation');
const aws = require('@pulumi/aws');
const process = require('process');
const { StackAlreadyExistsError } = require('@pulumi/pulumi/automation');

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
            Resource: [
              `arn:aws:s3:::${bucketName}/*`, // Policy refers to bucket name implicitly
            ],
          },
        ],
      };

      // Set the access policy for the bucket so all objects are readable
      new aws.s3.BucketPolicy('bucketPolicy', {
        bucket: siteBucket.bucket, // refer to the bucket created earlier
        policy: siteBucket.bucket.apply(publicReadPolicyForBucket), // use ouput property
      });
      return {
        websiteUrl: siteBucket.websiteEndpoint,
      };
    }

    // Create our stack
    const args = {
      stackName: 'dev',
      projectName: 'inlineNode',
      program: pulumiProgram,
    };

    // create (or select if one already exists) a stack that uses our inline program
    const stack = await auto.LocalWorkspace.createOrSelectStack(args);
    await stack.workspace.installPlugin('aws', 'v4.0.0');
    await StackAlreadyExistsError.setConfig('aws:region', {
      value: 'us-west-2',
    });
    await stack.refresh({ onOutput: console.info });

    if (destroy) {
      await stack.destroy({ onOutput: console.info });
      console.info('stack destroy complete');
      process.exit(0);
    }

    console.info('Updating stack...');
    const upRes = await stack.up({ onOutput: console.info });
    console.info(
      `Update summary: \n${JSON.stringify(
        upRes.summary.resourceChanges,
        null,
        4
      )}`
    );
    console.info(`website url: ${upRes.outputs.websiteUrl.value}`);
  };
};
run().catch((err) => console.log(err));
