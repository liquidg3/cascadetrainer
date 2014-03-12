cascadetrainer
===============
very simple wrapper for opencv_createsamples to allow it to accept many positives for generation. it'll set everything
up you need to start training at any place you request (defaults to ~/Desktop/training

setup your directory structure like this

	positives
		sample-1
			image.png
			whatever.jpg
			...	
		sample-2
			different-dimensions.png
			orwhatever
	negatives
		foo.jpg
		bar.png
		...	
	backgrounds
		foo.jpg
		bar.png
		...
	cascadetrainer
		generate_samplmes.js
		....
 
 usage
 ----

	cd cascadetrainer 
	./generate_samples.js 
	 
The mergevec and convert_cascade were compiled on my Macbook Pro with OS X (10.9.2) so no promises they works. =)