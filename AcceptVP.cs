using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;
using UnityEngine.SceneManagement;

public class AcceptVP : MonoBehaviour
{
    public Button mButton;
    public List<GameObject> candidatesToCheck;
    public GameObject deactivate;
    public GameObject activate;
    public float li;
    public float la;
    public float re;
    public float ow;
    public float wo;
    public float im;
    public float libTarget = 0.25f;
    public float liberTarget = 0.25f;
    public float modTarget = 0.5f;
    public float toleranceRange = 0.3f;
    public float impactMult = 3f;

    // Start is called before the first frame update
    void Start()
    {
        mButton.onClick.AddListener(onButtonClick);
        li = (float)Variables.Saved.Get("Liberal");
        la = (float)Variables.Saved.Get("Libertarian");
        wo = (float)Variables.Saved.Get("Workers");
        ow = (float)Variables.Saved.Get("Owners");
        re = (float)Variables.Saved.Get("Religious");
        im = (float)Variables.Saved.Get("Immigrants");
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    void onButtonClick()
    {
        foreach(GameObject g in candidatesToCheck)
        {
            if (g.activeSelf)
            {
                Slider[] sliderVals = g.GetComponentsInChildren<Slider>();
                float s1 = sliderVals[0].value;
                float s2 = sliderVals[1].value;
                float liberal = ((1 - Mathf.Abs(s1-libTarget)) - toleranceRange)*impactMult;
                float libertarian = ((1 - Mathf.Abs(s1-modTarget)) - toleranceRange)*impactMult;
                float owners = ((1 - Mathf.Abs(s1-(1-libTarget))) - toleranceRange)*impactMult;
                float workers = ((1 - Mathf.Abs(s2-liberTarget)) - toleranceRange)*impactMult;
                float religious = ((1 - Mathf.Abs(s2-modTarget)) - toleranceRange)*impactMult;
                float immigrants = ((1 - Mathf.Abs(s2-(1-liberTarget))) - toleranceRange)*impactMult;
                Variables.Saved.Set("Liberal", li + liberal);
                Variables.Saved.Set("Libertarian", la + libertarian);
                Variables.Saved.Set("Owners", ow + owners);
                Variables.Saved.Set("Workers", wo + workers);
                Variables.Saved.Set("Religious", re + religious);
                Variables.Saved.Set("Immigrants", im + immigrants);
            }
        }
        activate.SetActive(true);
        deactivate.SetActive(false);
    }
}
