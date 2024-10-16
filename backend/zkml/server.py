# this is the python code for generating the ZK proof
# Debashish Buragohain

# ZKML consists of three steps
# 1. Setup
# 2. Proving
# 3. Verifiying
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import torch
import json
import logging
import ezkl
import asyncio

app = Flask(__name__)
CORS(app)

logging.getLogger('ezkl').setLevel(logging.ERROR)
@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'message': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400
    
    # save the uploaded .onnx file
    model_path = os.path.join('uploaded_model.onnx')
    file.save(model_path)

    # run the processing script
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        outputs = loop.run_until_complete(process_model(model_path))
    except Exception as e:
        print(e)
        return jsonify({'message': 'Error processing the model', 'error': str(e)}), 500
    finally:
        loop.close()

    # Optionally delete the uploaded file after processing
    # os.remove(model_path)
    return jsonify({'message': 'Model processed successfully', 'outputs': outputs}), 200

# function to actually process the model
# processing includes:
# 1. compiling the model
# 2. creating the circuit 
# 3. creating the proof
# 4. verifying the proof

# 1 -> we create a .compiled file from the .onnx file and settings.json file to create the format ready for proving
# 2 -> from the compiled model and SRS (structured reference string) we create the circuit params that consists of
# the verifier key and the proving keys
# 3 -> for creating the proof, we first need a witness file. We create the proof now using the witness file, proving key
# SRS and the compiled model for creating the proof
async def process_model(model_path):        
    # paths for model and output files
    compiled_model_path = os.path.join('network.compiled')
    pk_path = os.path.join('test.pk')
    vk_path = os.path.join('test.vk')
    settings_path = os.path.join('settings.json')
    witness_path = os.path.join('witness.json')
    data_path = os.path.join('input.json')
    cal_path = os.path.json('calibration.json') 
    # calibration is for choosing whether to target better accuracy or minimize resource usage
    proof_path = os.path.join('test.pf')

    outputs = []

    # 1. prepare input data
    outputs.append("Step 1: Preparing input data for the model.")
    # hard coded size of the model
    input_data = torch.rand(1, 1, 30, 72).detach().numpy()
    data_array = input_data.reshape([-1]).tolist()

    # save the random input data to a JSON file
    outputs.append("Saving input data to JSON format.")
    data = dict(input_data=[data_array])
    json.dump(data, open(data_path, 'w'))
    outputs.append(f"Input data saved to: {data_path}")

    # 2. Generate the EZKL settings
    outputs.append("Step 2: Generating EZKL setitngs for the ONNX model.")
    py_run_args = ezkl.PyRunArgs()
    py_run_args.input_visibility = "public"
    py_run_args.output_visibility = "public"
    py_run_args.param_visibility = "private"
    
    # finally generate the settings file now
    res = ezkl.gen_settings(model_path, settings_path, py_run_args=py_run_args)
    if res:
        outputs.append(f"EZKL settings successfully generated and saved to: {settings_path}")
    else:
        outputs.append("Error in generating EZKL settings.")
        raise Exception("Error in generating EZKL settings.")
    

    # 3. Calibarate the model settings using random data
    # calibration file is the only one that we are manually generating here
    # using the input.json file we can modify the model to be targetted towards a more accurate or a resoruce saving config
    outputs.append("Step 3: Preparing random data for model calibration.")    
    calibration_data = (torch.rand(20, 1, 30, 72).detach().numpy()).reshape([-1]).tolist()
    calibration_dict = dict(input_data=[calibration_data])
    json.dump(calibration_dict, open(cal_path, "w"))
    outputs.append(f"Calibration data saved to: {cal_path}")

    # calibrate the settings
    outputs.append("Calibrating model settings. This may take a moment...")
    # so we are targetting the calibration for resources
    await ezkl.calibrate_settings(cal_path, model_path, settings_path, "resources")
    outputs.append("Model calibration completed.")

    # 4. Compile the circuit
    outputs.append("Step 4: Compiling the model circuit for ZK proof generation.")
    res = ezkl.compile_circuit(model_path, compiled_model_path, settings_path)
    if res:
        outputs.append(f"Model circuit compiled successfully and saved to: {compiled_model_path}")
    else:
        outputs.append("Error in compiling model circuit.")
        raise Exception("Error in compiling the model circuit.")

    # 5. Fetch the structured reference string (SRS)
    outputs.append("Step 5: Fetching Structred Reference String (SRS) for ZK proof.")
    # we generate the SRS from the settings file itself
    res = await ezkl.get_srs(settings_path)
    outputs.append("SRS fetched successfully.")

    # 6. Generate the witness file
    outputs.append("Step 6: Generating the witness file based on the input data and compiled circuit.")
    res = await ezkl.gen_witness(data_path, compiled_model_path, witness_path)
    if os.path.isfile(witness_path):
        outputs.append(f"Witness file generated and saved to: {witness_path}")
    else:
        outputs.append("Error in generating witness file.")
        raise Exception("Error in generating witness file.")
    
    # 7. Setup the circuit parametes and generate the keys
    outputs.append("Step 7: Setting up circuit parameters and generating keys (verification and prover keys)")
    
    # the verifier and prover keys are generated from the compiled model itself
    res = ezkl.setup(compiled_model_path, vk_path, pk_path)
    if res:
        outputs.append(f"Verification key saved to: {vk_path}")
        outputs.append(f"Proving key saved to: {pk_path}")
    else:
        outputs.append("Error in generating the circuit and generating keys.")
        raise Exception("Error in generating the circuit and generating keys.")
    
    # 8. Generate a proof
    outputs.append("Step 8: Generating the Zero-Knowledge Proof")
    res = ezkl.prove(witness_path, compiled_model_path, pk_path, proof_path, "single")
    if os.path.isfile(proof_path):
        outputs.append(f"Proof successsfully generated and saved to: {proof_path}")
    else:
        outputs.append("Error in generating the proof.")
        raise Exception("Error in generating the proof.")
    
    # 9. Verifying the proof
    outputs.append("Step 9: Verifying the proof to ensure correctness.")
    res = ezkl.verify(proof_path, settings_path, vk_path)
    if res:
        outputs.append("Proof verified successfully! Everything is authentic.")
    else:
        outputs.append("Proof verification failed.")
        raise Exception("Proof verification failed.")

    # that completes our entire ZKML
    return outputs


if __name__ == '__main__':
    app.run(debug=True)