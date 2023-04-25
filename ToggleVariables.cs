using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using Unity.VisualScripting;
using TMPro;

public class ToggleVariables : MonoBehaviour
{
    public float liberal;
    public float libertarian;
    public float immigrant;
    public float owner;
    public float worker;
    public float religious;
    public float li;
    public float la;
    public float re;
    public float wo;
    public float im;
    public float ow;
    public float ap;
    public Slider mainSlider;

    // Start is called before the first frame update
    void Start()
    {
        mainSlider = GetComponent<Slider>();
        //Add listener for when the state of the Toggle changes, to take action
        mainSlider.onValueChanged.AddListener(delegate {SliderValueChanged(mainSlider);});

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

    void SliderValueChanged(Slider change)
    {
        int modifier = 0;
        if (change.value == 1)
        {
            modifier = 2;
        }
        else
        {
            modifier = -2;
        }
        Variables.Saved.Set("Liberal", li + (liberal*modifier));
        Variables.Saved.Set("Libertarian", la + (libertarian*modifier));
        Variables.Saved.Set("Workers", wo + (worker*modifier));
        Variables.Saved.Set("Immigrants", im + (immigrant*modifier));
        Variables.Saved.Set("Owners", ow + (owner*modifier));
        Variables.Saved.Set("Religious", re + (religious*modifier));
    }
}
